import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import delete, select

from app.db.database import AsyncSessionLocal
from app.models.model_content import GrammarLessons, Stories, VocabEntries
from app.models.model_course import CourseUnit, CourseUnitStories, CourseUnitVocab

CONTENTS_ROOT = Path(__file__).resolve().parents[2] / 'contents'

LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

CONTENT_PLAN_FILES = {
    'A1': 'content_plan_beginner.json',
    'A2': 'content_plan_elementary.json',
    'B1': 'content_plan_pre-intermediate.json',
    'B2': 'content_plan_intermediate.json',
    'C1': 'content_plan_upper-intermediate.json',
}

STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are',
    'am', 'be', 'this', 'that', 'it', 'as', 'at', 'by', 'from', 'not',
}

MATCH_THRESHOLD = 0.15


def _tokenize(text):
    if not text:
        return set()
    words = re.findall(r'[a-zA-Z]+', text.lower())
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


def _jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _source_idx(source_key):
    suffix = source_key.rsplit(':', 1)[1]
    return int(suffix) if suffix.isdigit() else float('inf')


def _load_content_plan(level):
    path = CONTENTS_ROOT / 'plans' / CONTENT_PLAN_FILES[level]
    data = json.loads(path.read_text(encoding='utf-8'))
    by_unit = {}
    for unit in data['units']:
        by_unit.setdefault(str(unit['unit']), []).extend(unit['lessons'])
    return by_unit


def _estimate_minutes(has_vocab, has_stories):
    minutes = 12 + 5
    if has_vocab:
        minutes += 8
    if has_stories:
        minutes += 10
    return minutes


async def build_level(level, db, report):
    plan_by_unit = _load_content_plan(level)

    grammar_rows = (
        await db.execute(
            select(GrammarLessons).where(GrammarLessons.cefr_level == level)
        )
    ).scalars().all()
    grammar_rows.sort(key=lambda g: _source_idx(g.source_key))

    numbered_rows = [g for g in grammar_rows if (g.unit or '').isdigit()]
    supplementary_rows = [g for g in grammar_rows if not (g.unit or '').isdigit()]

    grammar_by_unit = {}
    for g in numbered_rows:
        grammar_by_unit.setdefault(g.unit, []).append(g)

    story_rows = (
        await db.execute(select(Stories).where(Stories.cefr_level == level))
    ).scalars().all()
    story_rows.sort(key=lambda s: _source_idx(s.source_key))

    unit_topic_tokens = {
        unit: set().union(*[_tokenize(g.topic) for g in rows])
        for unit, rows in grammar_by_unit.items()
    }

    stories_by_unit = {unit: [] for unit in grammar_by_unit}
    unmatched_stories = 0
    for story in story_rows:
        story_tokens = _tokenize(story.grammar_topic)
        best_unit, best_score = None, 0.0
        for unit, tokens in unit_topic_tokens.items():
            score = _jaccard(story_tokens, tokens)
            if score > best_score:
                best_unit, best_score = unit, score

        if best_unit is None or best_score < MATCH_THRESHOLD:
            unmatched_stories += 1
            position = story_rows.index(story) / max(len(story_rows), 1)
            ordered_units = sorted(grammar_by_unit, key=lambda u: int(u))
            fallback_unit = ordered_units[min(int(position * len(ordered_units)), len(ordered_units) - 1)]
            stories_by_unit[fallback_unit].append((story, None))
        else:
            stories_by_unit[best_unit].append((story, round(best_score, 3)))

    vocab_rows = (
        await db.execute(select(VocabEntries).where(VocabEntries.cefr_level == level))
    ).scalars().all()
    vocab_by_unit = {}
    for v in vocab_rows:
        vocab_by_unit.setdefault(v.unit, []).append(v)

    course_units = []
    unmatched_grammar_titles = 0

    for unit_number in sorted(grammar_by_unit, key=lambda u: int(u)):
        rows = grammar_by_unit[unit_number]
        plan_lessons = list(plan_by_unit.get(unit_number, []))

        assigned_codes = {}
        used_plan_idx = set()
        for gi, g in enumerate(rows):
            g_tokens = _tokenize(g.topic)
            best_pi, best_score = None, 0.0
            for pi, lesson in enumerate(plan_lessons):
                if pi in used_plan_idx:
                    continue
                score = _jaccard(g_tokens, _tokenize(lesson.get('grammar')))
                if score > best_score:
                    best_pi, best_score = pi, score

            if best_pi is not None and best_score >= MATCH_THRESHOLD:
                used_plan_idx.add(best_pi)
                assigned_codes[gi] = plan_lessons[best_pi]
            else:
                assigned_codes[gi] = None
                unmatched_grammar_titles += 1

        used_letters = {m['code'][-1] for m in assigned_codes.values() if m}
        next_letter = 0

        for gi, g in enumerate(rows):
            matched = assigned_codes[gi]
            if matched is not None:
                unit_code = matched['code']
                theme_title = matched['theme']
            else:
                while chr(ord('A') + next_letter) in used_letters:
                    next_letter += 1
                unit_code = f'{unit_number}{chr(ord("A") + next_letter)}'
                used_letters.add(chr(ord('A') + next_letter))
                next_letter += 1
                theme_title = g.topic

            unit_stories = stories_by_unit.get(unit_number, [])
            unit_vocab = vocab_by_unit.get(unit_number, [])

            course_units.append({
                'unit_code': unit_code,
                'cefr_level': level,
                'source_unit_number': int(unit_number),
                'theme_title': theme_title,
                'grammar_topic_label': g.topic,
                'grammar_lesson_id': g.id,
                'grammar_row_index': gi,
                'grammar_row_count': len(rows),
                'unit_stories': unit_stories,
                'unit_vocab': unit_vocab,
            })

    for si, g in enumerate(supplementary_rows):
        course_units.append({
            'unit_code': f'{level}-X{si + 1}',
            'cefr_level': level,
            'source_unit_number': 900 + si,
            'theme_title': g.topic,
            'grammar_topic_label': g.topic,
            'grammar_lesson_id': g.id,
            'grammar_row_index': 0,
            'grammar_row_count': 1,
            'unit_stories': [],
            'unit_vocab': [],
        })

    report[level] = {
        'grammar_lessons': len(grammar_rows),
        'numbered_grammar_lessons': len(numbered_rows),
        'supplementary_grammar_lessons': len(supplementary_rows),
        'stories': len(story_rows),
        'vocab': len(vocab_rows),
        'unmatched_stories_positional_fallback': unmatched_stories,
        'grammar_without_content_plan_title': unmatched_grammar_titles,
    }

    return course_units


async def run(reset, dry_run):
    report = {}

    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(CourseUnit.id))).scalars().all()
        if existing and not reset:
            print(f'{len(existing)} CourseUnit rows already exist. Pass --reset to rebuild.')
            return

        if existing and reset:
            await db.execute(delete(CourseUnitVocab))
            await db.execute(delete(CourseUnitStories))
            await db.execute(delete(CourseUnit))
            await db.commit()

        all_units = []
        for level in LEVELS:
            all_units.extend(await build_level(level, db, report))

        sequence_index = 0
        for entry in all_units:
            rows = entry.pop('grammar_row_count')
            gi = entry.pop('grammar_row_index')
            unit_stories = entry.pop('unit_stories')
            unit_vocab = entry.pop('unit_vocab')

            per_atom_stories = unit_stories[gi::rows] if rows else []
            per_atom_vocab = unit_vocab[gi::rows] if rows else []

            if dry_run:
                sequence_index += 1
                continue

            course_unit = CourseUnit(
                unit_code=entry['unit_code'],
                sequence_index=sequence_index,
                cefr_level=entry['cefr_level'],
                source_unit_number=entry['source_unit_number'],
                theme_title=entry['theme_title'],
                grammar_topic_label=entry['grammar_topic_label'],
                grammar_lesson_id=entry['grammar_lesson_id'],
                estimated_minutes=_estimate_minutes(bool(per_atom_vocab), bool(per_atom_stories)),
            )
            db.add(course_unit)
            await db.flush()

            for story, confidence in per_atom_stories:
                db.add(CourseUnitStories(course_unit_id=course_unit.id, story_id=story.id, match_confidence=confidence))

            for vocab_entry in per_atom_vocab:
                db.add(CourseUnitVocab(course_unit_id=course_unit.id, vocab_entry_id=vocab_entry.id))

            sequence_index += 1

        if not dry_run:
            await db.commit()

            level_boundaries = {}
            offset = 0
            for level in LEVELS:
                count = report[level]['grammar_lessons']
                level_boundaries[level] = (offset, offset + count - 1)
                offset += count

            all_saved = (await db.execute(select(CourseUnit))).scalars().all()
            all_saved.sort(key=lambda u: u.sequence_index)
            for level in LEVELS:
                start, end = level_boundaries[level]
                level_units_saved = [u for u in all_saved if start <= u.sequence_index <= end]
                if not level_units_saved:
                    continue
                mid = level_units_saved[len(level_units_saved) // 2 - 1] if len(level_units_saved) >= 2 else level_units_saved[0]
                final = level_units_saved[-1]
                mid.is_level_midpoint = True
                final.is_level_final = True

            await db.commit()

    print(f'--- course unit seed report (dry_run={dry_run}, reset={reset}) ---')
    for level, stats in report.items():
        print(f'{level}: {stats}')
    print(f'total CourseUnits: {sequence_index}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--reset', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    asyncio.run(run(args.reset, args.dry_run))
