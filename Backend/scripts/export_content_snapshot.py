"""Write the catalogue out of a database into a portable snapshot.

The seed files under contents/ only carry the first version of the course. Everything
added since — the long trilingual grammar explanations, the story dictionaries, the
comprehension questions, the vocabulary translations — was written straight into the
database by one-off scripts, so a freshly seeded deployment silently came up several
months behind. This snapshot is the missing link: run it against the database that
has the finished content and hand the file to import_content_snapshot.py.

Every row is keyed by its natural key rather than its primary key, so the snapshot can
be applied to a database whose ids look nothing like the source.

    python scripts/export_content_snapshot.py content_snapshot.json
"""
import asyncio
import io
import json
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import asyncpg

from app.core.config import settings

OUT = sys.argv[1] if len(sys.argv) > 1 else 'content_snapshot.json'


def unit_key(row):
    return row['cefr_level'] + '|' + row['unit_code']


async def main():
    conn = await asyncpg.connect(settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://'))

    lessons = await conn.fetch(
        """
        select id, source_key, cefr_level, unit, lesson, topic,
               rule_en, rule_ru, rule_tg, structure, tip_en, tip_ru, tip_tg,
               explanation_long_en, explanation_long_ru, explanation_long_tg
        from grammar_lessons where source_key is not null order by id
        """
    )
    stories = await conn.fetch(
        """
        select id, source_key, cefr_level, title_en, title_ru, title_tg,
               body_en, body_ru, body_tg, genre, grammar_topic, accent, word_dictionary
        from stories where source_key is not null order by id
        """
    )
    vocab = await conn.fetch(
        """
        select id, source_key, word, part_of_speech, example_en, translation_ru, translation_tg,
               cefr_level, unit
        from vocab_entries where source_key is not null order by id
        """
    )
    units = await conn.fetch(
        """
        select id, unit_code, sequence_index, cefr_level, source_unit_number,
               theme_title_ru, theme_title_en, theme_title_tg, grammar_topic_label,
               grammar_lesson_id, estimated_minutes, is_level_midpoint, is_level_final
        from course_units order by sequence_index, id
        """
    )

    lesson_key = {r['id']: r['source_key'] for r in lessons}
    story_key = {r['id']: r['source_key'] for r in stories}
    vocab_key = {r['id']: r['source_key'] for r in vocab}
    unit_key_by_id = {r['id']: unit_key(r) for r in units}

    examples = await conn.fetch(
        'select lesson_id, text, "order" from grammar_examples order by lesson_id, "order", id'
    )
    questions = await conn.fetch(
        """
        select lesson_id, type, text_en, text_ru, text_tg, options, answer,
               explanation_en, explanation_ru, explanation_tg
        from grammar_questions order by lesson_id, id
        """
    )
    story_questions = await conn.fetch(
        """
        select story_id, text_en, text_ru, text_tg, options, answer,
               explanation_en, explanation_ru, explanation_tg
        from story_questions order by story_id, id
        """
    )
    unit_stories = await conn.fetch(
        'select course_unit_id, story_id, match_confidence from course_unit_stories order by course_unit_id, id'
    )
    unit_vocab = await conn.fetch(
        'select course_unit_id, vocab_entry_id from course_unit_vocab order by course_unit_id, id'
    )
    level_tests = await conn.fetch('select cefr_level, test_type from level_tests order by id')

    def group(rows, owner, keys, fields):
        out = {}
        for r in rows:
            key = keys.get(r[owner])
            if key is None:
                continue
            row = {f: r[f] for f in fields}
            for f in ('options',):
                if isinstance(row.get(f), str):
                    row[f] = json.loads(row[f])
            out.setdefault(key, []).append(row)
        return out

    def strip(rows, drop):
        out = []
        for r in rows:
            row = dict(r)
            for f in drop:
                row.pop(f, None)
            out.append(row)
        return out

    story_rows = strip(stories, ['id'])
    for row in story_rows:
        if isinstance(row.get('word_dictionary'), str):
            row['word_dictionary'] = json.loads(row['word_dictionary'])

    unit_rows = []
    for r in units:
        row = dict(r)
        row['grammar_lesson_key'] = lesson_key.get(row.pop('grammar_lesson_id'))
        row.pop('id')
        unit_rows.append(row)

    payload = {
        'grammar_lessons': strip(lessons, ['id']),
        'grammar_examples': group(examples, 'lesson_id', lesson_key, ['text', 'order']),
        'grammar_questions': group(
            questions, 'lesson_id', lesson_key,
            ['type', 'text_en', 'text_ru', 'text_tg', 'options', 'answer',
             'explanation_en', 'explanation_ru', 'explanation_tg'],
        ),
        'stories': story_rows,
        'story_questions': group(
            story_questions, 'story_id', story_key,
            ['text_en', 'text_ru', 'text_tg', 'options', 'answer',
             'explanation_en', 'explanation_ru', 'explanation_tg'],
        ),
        'vocab_entries': strip(vocab, ['id']),
        'course_units': unit_rows,
        'course_unit_stories': group(unit_stories, 'course_unit_id', unit_key_by_id, ['story_id', 'match_confidence']),
        'course_unit_vocab': group(unit_vocab, 'course_unit_id', unit_key_by_id, ['vocab_entry_id']),
        'level_tests': [dict(r) for r in level_tests],
    }

    for rows in payload['course_unit_stories'].values():
        for row in rows:
            row['story_key'] = story_key.get(row.pop('story_id'))
    for rows in payload['course_unit_vocab'].values():
        for row in rows:
            row['vocab_key'] = vocab_key.get(row.pop('vocab_entry_id'))

    with io.open(OUT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False)

    await conn.close()

    print(f'wrote {OUT} ({os.path.getsize(OUT) // 1024} KB)')
    print('lessons', len(payload['grammar_lessons']), '| stories', len(payload['stories']),
          '| vocab', len(payload['vocab_entries']), '| units', len(payload['course_units']))


if __name__ == '__main__':
    asyncio.run(main())
