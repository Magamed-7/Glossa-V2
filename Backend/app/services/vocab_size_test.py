import random
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_profile import UserProfiles
from app.models.model_vocab_size_test import VocabSizeTestAttempts
from app.services import ratings

# Non-cumulative CEFR bands sliced from a real English frequency list (ranked by
# actual usage, not hand-picked) so the sampled words reflect genuine difficulty,
# not curriculum bias. Slice sizes match the standard cumulative CEFR word-family
# benchmarks (A1 500, A2 1000, B1 2000, B2 4000, C1 8000, C2 16000) — summing the
# per-level estimates reproduces that same total.
LEVEL_BANDS = {
    'A1': (0, 500),
    'A2': (500, 1000),
    'B1': (1000, 2000),
    'B2': (2000, 4000),
    'C1': (4000, 8000),
    'C2': (8000, 16000),
}
LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

REAL_PER_LEVEL = 8
PSEUDO_PER_LEVEL = 3

_FREQ_WORDS: list[str] | None = None

_PSEUDO_ONSETS = [
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk',
    'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'th', 'sh', 'ch', 'wh', 'b', 'c',
    'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w',
]
_PSEUDO_NUCLEI = ['a', 'e', 'i', 'o', 'u', 'ai', 'ea', 'oo', 'ou', 'ee', 'oi', 'ay']
_PSEUDO_CODAS = [
    'b', 'ck', 'd', 'ft', 'g', 'k', 'l', 'ld', 'lt', 'm', 'mp', 'n', 'nd', 'ng',
    'nt', 'p', 'r', 'rd', 'rk', 'rn', 'rt', 's', 'sh', 'st', 't', 'th', 've', 'z',
    'ble', 'ter', 'ple', 'tion', 'ness', 'ful',
]


def _load_freq_words():
    global _FREQ_WORDS
    if _FREQ_WORDS is not None:
        return _FREQ_WORDS

    path = Path(__file__).resolve().parents[1] / 'data' / 'en_freq_20k.txt'
    with open(path, encoding='utf-8') as f:
        _FREQ_WORDS = [line.strip().lower() for line in f if line.strip()]
    return _FREQ_WORDS


def _sample_real_words(level: str, count: int):
    words = _load_freq_words()
    start, end = LEVEL_BANDS[level]
    band = [w for w in words[start:end] if w.isalpha() and len(w) >= 3]
    return random.sample(band, min(count, len(band)))


def _generate_pseudowords(count: int, real_word_set: set[str]):
    pseudo = set()
    attempts = 0

    while len(pseudo) < count and attempts < count * 30:
        attempts += 1
        syllables = random.choice([1, 2])
        word = ''
        for _ in range(syllables):
            word += random.choice(_PSEUDO_ONSETS) + random.choice(_PSEUDO_NUCLEI)
        word += random.choice(_PSEUDO_CODAS)

        if len(word) < 3 or word in real_word_set or word in pseudo:
            continue
        pseudo.add(word)

    return list(pseudo)


def _build_items():
    all_real = set(_load_freq_words())
    items = []
    item_id = 1

    for level in LEVEL_ORDER:
        real_words = _sample_real_words(level, REAL_PER_LEVEL)
        pseudo_words = _generate_pseudowords(PSEUDO_PER_LEVEL, all_real)

        for word in real_words:
            items.append({'id': item_id, 'word': word, 'level': level, 'is_pseudo': False})
            item_id += 1
        for word in pseudo_words:
            items.append({'id': item_id, 'word': word, 'level': level, 'is_pseudo': True})
            item_id += 1

    random.shuffle(items)
    return items


async def start_test(user_id: int, db: AsyncSession):
    items = _build_items()

    attempt = VocabSizeTestAttempts(user_id=user_id, items_snapshot=items, status='ready')
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    public_items = [{'id': i['id'], 'word': i['word']} for i in items]
    return attempt.id, public_items


def _score(items: list[dict], known_ids: set[int]):
    by_level = {}

    for level in LEVEL_ORDER:
        level_items = [i for i in items if i['level'] == level]
        real_items = [i for i in level_items if not i['is_pseudo']]
        pseudo_items = [i for i in level_items if i['is_pseudo']]

        real_known = sum(1 for i in real_items if i['id'] in known_ids)
        pseudo_known = sum(1 for i in pseudo_items if i['id'] in known_ids)

        real_rate = real_known / len(real_items) if real_items else 0
        false_yes_rate = pseudo_known / len(pseudo_items) if pseudo_items else 0
        adjusted_rate = max(0.0, real_rate - false_yes_rate)

        band_start, band_end = LEVEL_BANDS[level]
        band_size = band_end - band_start
        estimated_words = round(adjusted_rate * band_size)

        by_level[level] = {
            'level': level,
            'known_rate': round(adjusted_rate * 100, 1),
            'estimated_words': estimated_words,
        }

    estimated_total = sum(v['estimated_words'] for v in by_level.values())
    return [by_level[level] for level in LEVEL_ORDER], estimated_total


async def submit_test(user_id: int, attempt_id: int, known_ids: list[int], db: AsyncSession):
    attempt = (
        await db.execute(
            select(VocabSizeTestAttempts).where(
                VocabSizeTestAttempts.id == attempt_id, VocabSizeTestAttempts.user_id == user_id
            )
        )
    ).scalar_one_or_none()

    if attempt is None:
        raise AppError(code='TEST_ATTEMPT_NOT_FOUND', message='Test attempt not found', status_code=404)
    if attempt.status != 'ready':
        raise AppError(code='TEST_ALREADY_SUBMITTED', message='This test was already submitted', status_code=400)

    by_level, estimated_total = _score(attempt.items_snapshot, set(known_ids))

    attempt.by_level = by_level
    attempt.estimated_total = estimated_total
    attempt.status = 'completed'
    attempt.completed_at = datetime.now(timezone.utc)
    await db.commit()

    overall_known_rate = sum(v['known_rate'] for v in by_level) / len(by_level)
    xp_amount = 15
    if overall_known_rate >= 90:
        xp_amount += 10
    elif overall_known_rate >= 60:
        xp_amount += 5
    xp_transaction = await ratings.award_xp(user_id, 'review_passed', db, amount=xp_amount)

    return {
        'attempt_id': attempt.id,
        'by_level': by_level,
        'estimated_total': estimated_total,
        'xp_earned': xp_transaction.amount if xp_transaction else 0,
    }


async def confirm_result(user_id: int, attempt_id: int, accepted: bool, adjusted_total: int | None, db: AsyncSession):
    attempt = (
        await db.execute(
            select(VocabSizeTestAttempts).where(
                VocabSizeTestAttempts.id == attempt_id, VocabSizeTestAttempts.user_id == user_id
            )
        )
    ).scalar_one_or_none()

    if attempt is None or attempt.status != 'completed':
        raise AppError(code='TEST_ATTEMPT_NOT_FOUND', message='Completed test attempt not found', status_code=404)

    final_total = attempt.estimated_total if accepted else adjusted_total
    if final_total is None:
        raise AppError(code='ADJUSTED_TOTAL_REQUIRED', message='Provide an adjusted total', status_code=400)

    attempt.confirmed_total = final_total
    attempt.status = 'confirmed'

    profile_result = await db.execute(select(UserProfiles).where(UserProfiles.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if profile is None:
        profile = UserProfiles(user_id=user_id)
        db.add(profile)

    profile.estimated_vocabulary_size = final_total
    profile.vocabulary_estimated_at = datetime.now(timezone.utc)

    await db.commit()
    return {'estimated_vocabulary_size': final_total, 'vocabulary_estimated_at': profile.vocabulary_estimated_at}
