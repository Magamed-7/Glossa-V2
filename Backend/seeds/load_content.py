import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import (
    GrammarExamples,
    GrammarLessons,
    GrammarQuestions,
    Stories,
    StoryWords,
    VocabEntries,
)

LEVEL_DIRS = {
    'A1': None,
    'A2': 'Elementary',
    'B1': 'Pre-Intermediate',
    'B2': 'Intermediate',
    'C1': 'Upper-Intermediate',
    'C2': None,
}

CONTENTS_ROOT = Path(__file__).resolve().parents[2] / 'contents'

LOADERS = {}


def loader(content_type):
    def register(fn):
        LOADERS[content_type] = fn
        return fn

    return register


def _level_dir(level):
    sub = LEVEL_DIRS[level]
    return CONTENTS_ROOT if sub is None else CONTENTS_ROOT / sub


def _read_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


async def _already_seeded(model, source_key, db):
    result = await db.execute(select(model.id).where(model.source_key == source_key))
    return result.scalar_one_or_none() is not None


@loader('vocabulary')
async def load_vocabulary(level, dry_run, db):
    if level not in ('A1', 'A2', 'B1', 'B2', 'C1'):
        raise NotImplementedError(
            f'Vocabulary format for {level} not verified against real files yet (belongs to step 15.x for that level)'
        )

    entries = _read_json(_level_dir(level) / 'Vocabluary' / 'vocab_extract.json')

    created = 0
    skipped = 0
    missing_translation = 0

    for idx, entry in enumerate(entries):
        source_key = f'seed:{level}:vocab:{idx}'

        if await _already_seeded(VocabEntries, source_key, db):
            skipped += 1
            continue

        translation_ru = entry.get('translation_ru')
        translation_tg = entry.get('translation_tg')

        if translation_ru is None and translation_tg is None:
            missing_translation += 1

        if dry_run:
            created += 1
            continue

        db.add(
            VocabEntries(
                word=entry['word'],
                part_of_speech=entry.get('part_of_speech'),
                example_en=entry.get('example_en'),
                translation_ru=translation_ru,
                translation_tg=translation_tg,
                cefr_level=level,
                unit=str(entry.get('unit')) if entry.get('unit') is not None else None,
                source_key=source_key,
            )
        )
        created += 1

    if not dry_run:
        await db.commit()

    if missing_translation:
        print(
            f'  [warning] {missing_translation}/{len(entries)} vocabulary entries have no ru/tg '
            f'translation in the source file — loaded with NULL translations, needs a follow-up '
            f'translation pass (see progres.md/bugs.md)'
        )

    return created, skipped


GRAMMAR_LEVEL_OVERRIDES = {
    "have to, don't have to, must, mustn't": "A2",
    "should": "A2",
    "quantifiers: too, not enough": "A2",
    "time sequencers and connectors": "A2",
    "question tags": "B1",
    "unreal conditionals (mixed conditionals)": "B2",
    "wish for present/future situations; wish for past regrets": "B2",
    "so, neither + auxiliaries": "C1",
}


async def _load_grammar_a1(level, dry_run, db):
    grammar_dir = _level_dir(level) / 'Grammar'
    g_en = _read_json(grammar_dir / 'grammar_extract_en.json')
    g_ru = _read_json(grammar_dir / 'grammar_extract_ru.json')
    g_tg = _read_json(grammar_dir / 'grammar_extract_tg.json')
    q_en = _read_json(grammar_dir / 'questions_en.json')
    q_ru = _read_json(grammar_dir / 'questions_ru.json')
    q_tg = _read_json(grammar_dir / 'questions_tg.json')

    if not (len(g_en) == len(g_ru) == len(g_tg) == len(q_en) == len(q_ru) == len(q_tg)):
        raise ValueError(
            f'Grammar file lesson counts do not match for {level}: '
            f'en={len(g_en)} ru={len(g_ru)} tg={len(g_tg)} q_en={len(q_en)} q_ru={len(q_ru)} q_tg={len(q_tg)}'
        )

    created = 0
    skipped = 0

    for idx, lesson_en in enumerate(g_en):
        source_key = f'seed:{level}:grammar:{idx}'

        if await _already_seeded(GrammarLessons, source_key, db):
            skipped += 1
            continue

        if dry_run:
            created += 1
            continue

        lesson = GrammarLessons(
            cefr_level=GRAMMAR_LEVEL_OVERRIDES.get(lesson_en['topic'], level),
            unit=str(lesson_en.get('unit')) if lesson_en.get('unit') is not None else None,
            lesson=f"Unit {lesson_en.get('unit')}: {lesson_en['topic']}",
            topic=lesson_en['topic'],
            rule_en=lesson_en.get('rule_en'),
            rule_ru=g_ru[idx].get('rule_en'),
            rule_tg=g_tg[idx].get('rule_en'),
            structure=lesson_en.get('structure'),
            tip_en=lesson_en.get('tip'),
            tip_ru=g_ru[idx].get('tip'),
            tip_tg=g_tg[idx].get('tip'),
            source_key=source_key,
        )
        db.add(lesson)
        await db.flush()

        for order, example_text in enumerate(lesson_en.get('examples_en', [])):
            db.add(GrammarExamples(lesson_id=lesson.id, text=example_text, order=order))

        for q_idx, question_en in enumerate(q_en[idx]):
            question_ru = q_ru[idx][q_idx]
            question_tg = q_tg[idx][q_idx]

            db.add(
                GrammarQuestions(
                    lesson_id=lesson.id,
                    type=question_en['type'],
                    text_en=question_en['text'],
                    text_ru=question_ru.get('text'),
                    text_tg=question_tg.get('text'),
                    options=question_en.get('options'),
                    answer=question_en['answer'],
                    explanation_en=question_en.get('explanation'),
                    explanation_ru=question_ru.get('explanation'),
                    explanation_tg=question_tg.get('explanation'),
                )
            )

        created += 1

    if not dry_run:
        await db.commit()

    return created, skipped


async def _load_grammar_embedded(level, dry_run, db):
    grammar_dir = _level_dir(level) / 'Grammar'
    g_en = _read_json(grammar_dir / 'grammar_extract_en.json')
    g_ru = _read_json(grammar_dir / 'grammar_extract_ru.json')
    g_tg = _read_json(grammar_dir / 'grammar_extract_tg.json')

    if not (len(g_en) == len(g_ru) == len(g_tg)):
        raise ValueError(
            f'Grammar file lesson counts do not match for {level}: en={len(g_en)} ru={len(g_ru)} tg={len(g_tg)}'
        )

    created = 0
    skipped = 0

    for idx, lesson_en in enumerate(g_en):
        source_key = f'seed:{level}:grammar:{idx}'

        if await _already_seeded(GrammarLessons, source_key, db):
            skipped += 1
            continue

        if dry_run:
            created += 1
            continue

        lesson_ru = g_ru[idx]
        lesson_tg = g_tg[idx]

        lesson = GrammarLessons(
            cefr_level=GRAMMAR_LEVEL_OVERRIDES.get(lesson_en['topic'], level),
            unit=str(lesson_en.get('unit')) if lesson_en.get('unit') is not None else None,
            lesson=lesson_en['lesson'],
            topic=lesson_en['topic'],
            rule_en=lesson_en.get('rule_en'),
            rule_ru=lesson_ru.get('rule_en'),
            rule_tg=lesson_tg.get('rule_en'),
            structure=lesson_en.get('structure'),
            tip_en=lesson_en.get('tip'),
            tip_ru=lesson_ru.get('tip'),
            tip_tg=lesson_tg.get('tip'),
            source_key=source_key,
        )
        db.add(lesson)
        await db.flush()

        for order, example_text in enumerate(lesson_en.get('examples_en', [])):
            db.add(GrammarExamples(lesson_id=lesson.id, text=example_text, order=order))

        questions_en = lesson_en.get('questions', [])
        questions_ru = lesson_ru.get('questions', [])
        questions_tg = lesson_tg.get('questions', [])

        if not (len(questions_en) == len(questions_ru) == len(questions_tg)):
            raise ValueError(f'Question count mismatch for {level} lesson idx={idx} ({source_key})')

        for q_idx, question_en in enumerate(questions_en):
            question_ru = questions_ru[q_idx]
            question_tg = questions_tg[q_idx]

            db.add(
                GrammarQuestions(
                    lesson_id=lesson.id,
                    type=question_en['type'],
                    text_en=question_en['text'],
                    text_ru=question_ru.get('text'),
                    text_tg=question_tg.get('text'),
                    options=question_en.get('options'),
                    answer=question_en['answer'],
                    explanation_en=question_en.get('explanation'),
                    explanation_ru=question_ru.get('explanation'),
                    explanation_tg=question_tg.get('explanation'),
                )
            )

        created += 1

    if not dry_run:
        await db.commit()

    return created, skipped


@loader('grammar')
async def load_grammar(level, dry_run, db):
    if level == 'A1':
        return await _load_grammar_a1(level, dry_run, db)
    if level in ('A2', 'B1', 'B2', 'C1'):
        return await _load_grammar_embedded(level, dry_run, db)
    raise NotImplementedError(
        f'Grammar format for {level} not verified against real files yet (belongs to step 15.x for that level)'
    )


def _story_base_kwargs(level, source_key, story_en, story_ru, story_tg):
    return dict(
        title_en=story_en['title'],
        title_ru=story_ru.get('title'),
        title_tg=story_tg.get('title'),
        body_en=story_en['body'],
        body_ru=story_ru.get('body'),
        body_tg=story_tg.get('body'),
        cefr_level=level,
        genre=story_en.get('genre'),
        grammar_topic=story_en.get('grammar_topic'),
        is_system=True,
        source_key=source_key,
    )


async def _load_stories_a1(level, dry_run, db):
    stories_dir = _level_dir(level) / 'Stories'
    s_en = _read_json(stories_dir / 'stories_en.json')
    s_ru = _read_json(stories_dir / 'stories_ru.json')
    s_tg = _read_json(stories_dir / 'stories_tg.json')

    if not (len(s_en) == len(s_ru) == len(s_tg)):
        raise ValueError(f'Story file counts do not match for {level}: en={len(s_en)} ru={len(s_ru)} tg={len(s_tg)}')

    created = 0
    skipped = 0
    no_word_translations = 0

    for idx, story_en in enumerate(s_en):
        source_key = f'seed:{level}:story:{idx}'

        if await _already_seeded(Stories, source_key, db):
            skipped += 1
            continue

        if story_en.get('words_used'):
            no_word_translations += 1

        if dry_run:
            created += 1
            continue

        story = Stories(**_story_base_kwargs(level, source_key, story_en, s_ru[idx], s_tg[idx]))
        db.add(story)
        await db.flush()

        words_used = story_en.get('words_used', [])

        for word in words_used:
            db.add(StoryWords(story_id=story.id, word=word, translation_ru=None, translation_tg=None))

        created += 1

    if not dry_run:
        await db.commit()

    if no_word_translations:
        print(
            f'  [warning] {no_word_translations}/{len(s_en)} stories have word lists with no ru/tg '
            f'translation or context in the source file (only bare words) — loaded as-is, needs a '
            f'follow-up pass; no comprehension questions found in the source at all for this level'
        )

    return created, skipped


async def _load_stories_with_word_meta(level, dry_run, db):
    stories_dir = _level_dir(level) / 'Stories'
    s_en = _read_json(stories_dir / 'stories_en.json')
    s_ru = _read_json(stories_dir / 'stories_ru.json')
    s_tg = _read_json(stories_dir / 'stories_tg.json')

    if not (len(s_en) == len(s_ru) == len(s_tg)):
        raise ValueError(f'Story file counts do not match for {level}: en={len(s_en)} ru={len(s_ru)} tg={len(s_tg)}')

    created = 0
    skipped = 0

    for idx, story_en in enumerate(s_en):
        source_key = f'seed:{level}:story:{idx}'

        if await _already_seeded(Stories, source_key, db):
            skipped += 1
            continue

        if dry_run:
            created += 1
            continue

        story = Stories(**_story_base_kwargs(level, source_key, story_en, s_ru[idx], s_tg[idx]))
        db.add(story)
        await db.flush()

        for word_entry in story_en.get('words', []):
            db.add(
                StoryWords(
                    story_id=story.id,
                    word=word_entry['word'],
                    translation_ru=word_entry.get('translation_ru'),
                    translation_tg=word_entry.get('translation_tg'),
                    part_of_speech=word_entry.get('part_of_speech'),
                    context=word_entry.get('context'),
                )
            )

        created += 1

    if not dry_run:
        await db.commit()

    print(
        f'  [note] no reading-comprehension questions found in the {level} source files either '
        f'(same gap as A1) — StoryQuestions stays empty for this level'
    )

    return created, skipped


@loader('stories')
async def load_stories(level, dry_run, db):
    if level == 'A1':
        return await _load_stories_a1(level, dry_run, db)
    if level in ('A2', 'B1', 'B2', 'C1'):
        return await _load_stories_with_word_meta(level, dry_run, db)
    raise NotImplementedError(
        f'Stories format for {level} not verified against real files yet (belongs to step 15.x for that level)'
    )


async def run(level, dry_run):
    if level not in LEVEL_DIRS:
        print(f'Unknown level: {level}')
        return

    report = {}

    async with AsyncSessionLocal() as db:
        for content_type, load_fn in LOADERS.items():
            try:
                created, skipped = await load_fn(level, dry_run, db)
                report[content_type] = {'created': created, 'skipped': skipped}
            except NotImplementedError as exc:
                report[content_type] = {'created': 0, 'skipped': 0, 'note': str(exc)}

    print(f'--- content load report for {level} (dry_run={dry_run}) ---')
    for content_type, result in report.items():
        line = f"{content_type}: created={result['created']}, skipped={result['skipped']}"
        if 'note' in result:
            line += f" ({result['note']})"
        print(line)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--level', required=True, choices=list(LEVEL_DIRS.keys()))
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    asyncio.run(run(args.level, args.dry_run))
