"""Apply a catalogue snapshot to this database.

Rows are matched by their natural key, so the target keeps its own primary keys and
everything that points at them — reading progress, decks, attempts — keeps pointing at
the right thing. Child rows that have no key of their own (examples, questions, the
unit-to-story and unit-to-vocabulary links) are rebuilt for the parents in the file.

A unit is identified by its level together with its code: 1A exists at every CEFR
level, so the code alone matches six different units and quietly merges them.

    python scripts/import_content_snapshot.py content_snapshot.json
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import asyncpg

from app.core.config import settings

PATH = sys.argv[1] if len(sys.argv) > 1 else 'content_snapshot.json'

LESSON_FIELDS = [
    'cefr_level', 'unit', 'lesson', 'topic', 'rule_en', 'rule_ru', 'rule_tg', 'structure',
    'tip_en', 'tip_ru', 'tip_tg', 'explanation_long_en', 'explanation_long_ru', 'explanation_long_tg',
]
STORY_FIELDS = [
    'cefr_level', 'title_en', 'title_ru', 'title_tg', 'body_en', 'body_ru', 'body_tg',
    'genre', 'grammar_topic', 'accent',
]
VOCAB_FIELDS = ['word', 'part_of_speech', 'example_en', 'translation_ru', 'translation_tg', 'cefr_level', 'unit']
UNIT_FIELDS = [
    'sequence_index', 'source_unit_number', 'theme_title_ru', 'theme_title_en', 'theme_title_tg',
    'grammar_topic_label', 'estimated_minutes', 'is_level_midpoint', 'is_level_final',
]


async def upsert(conn, table, key_cols, fields, rows):
    inserted = updated = 0
    where = ' and '.join(f'{c} = ${i + 1}' for i, c in enumerate(key_cols))
    for row in rows:
        key_values = [row[c] for c in key_cols]
        values = [row[f] for f in fields]
        existing = await conn.fetchval(f'select id from {table} where {where}', *key_values)
        if existing is None:
            cols = ', '.join(key_cols + fields)
            marks = ', '.join(f'${i + 1}' for i in range(len(key_cols) + len(fields)))
            await conn.execute(f'insert into {table} ({cols}) values ({marks})', *key_values, *values)
            inserted += 1
        else:
            sets = ', '.join(f'{f} = ${i + 2}' for i, f in enumerate(fields))
            await conn.execute(f'update {table} set {sets} where id = $1', existing, *values)
            updated += 1
    return inserted, updated


def as_json(value):
    return json.dumps(value) if value is not None else None


async def main():
    payload = json.load(open(PATH, encoding='utf-8'))
    conn = await asyncpg.connect(settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://'))
    report = []

    async with conn.transaction():
        ins, upd = await upsert(conn, 'grammar_lessons', ['source_key'], LESSON_FIELDS, payload['grammar_lessons'])
        report.append(f'grammar_lessons: {ins} new, {upd} updated')

        lesson_ids = {
            r['source_key']: r['id']
            for r in await conn.fetch('select id, source_key from grammar_lessons where source_key is not null')
        }
        touched = [lesson_ids[k] for k in set(payload['grammar_examples']) | set(payload['grammar_questions']) if k in lesson_ids]
        await conn.execute(
            'delete from grammar_attempts where question_id in (select id from grammar_questions where lesson_id = any($1::int[]))',
            touched,
        )
        await conn.execute('delete from grammar_questions where lesson_id = any($1::int[])', touched)
        await conn.execute('delete from grammar_examples where lesson_id = any($1::int[])', touched)

        n_ex = n_q = 0
        for key, rows in payload['grammar_examples'].items():
            lid = lesson_ids.get(key)
            for r in rows if lid else []:
                await conn.execute(
                    'insert into grammar_examples (lesson_id, text, "order") values ($1, $2, $3)',
                    lid, r['text'], r['order'],
                )
                n_ex += 1
        for key, rows in payload['grammar_questions'].items():
            lid = lesson_ids.get(key)
            for r in rows if lid else []:
                await conn.execute(
                    """
                    insert into grammar_questions
                        (lesson_id, type, text_en, text_ru, text_tg, options, answer,
                         explanation_en, explanation_ru, explanation_tg)
                    values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
                    """,
                    lid, r['type'], r['text_en'], r['text_ru'], r['text_tg'], as_json(r['options']),
                    r['answer'], r['explanation_en'], r['explanation_ru'], r['explanation_tg'],
                )
                n_q += 1
        report.append(f'grammar examples: {n_ex}, grammar questions: {n_q}')

        ins, upd = await upsert(conn, 'vocab_entries', ['source_key'], VOCAB_FIELDS, payload['vocab_entries'])
        report.append(f'vocab_entries: {ins} new, {upd} updated')

        ins, upd = await upsert(conn, 'stories', ['source_key'], STORY_FIELDS, payload['stories'])
        report.append(f'stories: {ins} new, {upd} updated')

        story_ids = {
            r['source_key']: r['id']
            for r in await conn.fetch('select id, source_key from stories where source_key is not null')
        }
        for row in payload['stories']:
            sid = story_ids.get(row['source_key'])
            if sid is not None:
                await conn.execute(
                    'update stories set word_dictionary = $2::jsonb where id = $1',
                    sid, as_json(row['word_dictionary']),
                )

        sq_ids = [story_ids[k] for k in payload['story_questions'] if k in story_ids]
        await conn.execute('delete from story_questions where story_id = any($1::int[])', sq_ids)
        n_sq = 0
        for key, rows in payload['story_questions'].items():
            sid = story_ids.get(key)
            for r in rows if sid else []:
                await conn.execute(
                    """
                    insert into story_questions
                        (story_id, text_en, text_ru, text_tg, options, answer,
                         explanation_en, explanation_ru, explanation_tg)
                    values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
                    """,
                    sid, r['text_en'], r['text_ru'], r['text_tg'], as_json(r['options']),
                    r['answer'], r['explanation_en'], r['explanation_ru'], r['explanation_tg'],
                )
                n_sq += 1
        report.append(f'story questions: {n_sq}')

        # sequence_index is unique and the two databases number units differently, so
        # park the existing rows outside the positive range while the real positions
        # are handed out.
        await conn.execute('update course_units set sequence_index = -id where sequence_index >= 0')
        ins, upd = await upsert(
            conn, 'course_units', ['cefr_level', 'unit_code'], UNIT_FIELDS, payload['course_units']
        )
        await conn.execute('update course_units set sequence_index = 1000 - sequence_index where sequence_index < 0')
        report.append(f'course_units: {ins} new, {upd} updated')

        unit_ids = {
            r['cefr_level'] + '|' + r['unit_code']: r['id']
            for r in await conn.fetch('select id, cefr_level, unit_code from course_units')
        }
        for u in payload['course_units']:
            uid = unit_ids.get(u['cefr_level'] + '|' + u['unit_code'])
            lid = lesson_ids.get(u['grammar_lesson_key']) if u['grammar_lesson_key'] else None
            if uid is not None:
                await conn.execute('update course_units set grammar_lesson_id = $2 where id = $1', uid, lid)

        touched_units = [unit_ids[k] for k in set(payload['course_unit_stories']) | set(payload['course_unit_vocab']) if k in unit_ids]
        await conn.execute('delete from course_unit_stories where course_unit_id = any($1::int[])', touched_units)
        await conn.execute('delete from course_unit_vocab where course_unit_id = any($1::int[])', touched_units)

        vocab_ids = {
            r['source_key']: r['id']
            for r in await conn.fetch('select id, source_key from vocab_entries where source_key is not null')
        }
        n_us = n_uv = 0
        for key, rows in payload['course_unit_stories'].items():
            uid = unit_ids.get(key)
            for r in rows if uid else []:
                sid = story_ids.get(r['story_key'])
                if sid is None:
                    continue
                await conn.execute(
                    'insert into course_unit_stories (course_unit_id, story_id, match_confidence) values ($1, $2, $3)',
                    uid, sid, r['match_confidence'],
                )
                n_us += 1
        for key, rows in payload['course_unit_vocab'].items():
            uid = unit_ids.get(key)
            for r in rows if uid else []:
                vid = vocab_ids.get(r['vocab_key'])
                if vid is None:
                    continue
                await conn.execute(
                    'insert into course_unit_vocab (course_unit_id, vocab_entry_id) values ($1, $2)', uid, vid
                )
                n_uv += 1
        report.append(f'unit stories: {n_us}, unit vocabulary: {n_uv}')

        for lt in payload['level_tests']:
            exists = await conn.fetchval(
                'select id from level_tests where cefr_level is not distinct from $1 and test_type = $2',
                lt['cefr_level'], lt['test_type'],
            )
            if exists is None:
                await conn.execute(
                    'insert into level_tests (cefr_level, test_type) values ($1, $2)', lt['cefr_level'], lt['test_type']
                )

        keys = {u['cefr_level'] + '|' + u['unit_code'] for u in payload['course_units']}
        stale = [k for k in unit_ids if k not in keys]
        report.append('units not in the snapshot: ' + (', '.join(sorted(stale)) or 'none'))

    await conn.close()
    print('\n'.join(report))


if __name__ == '__main__':
    asyncio.run(main())
