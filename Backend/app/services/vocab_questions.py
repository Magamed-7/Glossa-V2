import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import VocabEntries
from app.services.crud_content import vocab_translation


async def get_level_vocab_pool(cefr_level: str, db: AsyncSession):
    result = await db.execute(select(VocabEntries).where(VocabEntries.cefr_level == cefr_level))
    return result.scalars().all()


_EXPLANATION_TEMPLATES = {
    'en': lambda word, translation, example: (
        f'"{word}" means "{translation}".' + (f' Example: {example}' if example else '')
    ),
    'ru': lambda word, translation, example: (
        f'«{word}» переводится как «{translation}».' + (f' Пример: {example}' if example else '')
    ),
    'tg': lambda word, translation, example: (
        f'«{word}» маънояш «{translation}» аст.' + (f' Мисол: {example}' if example else '')
    ),
}


def _vocab_explanation(entry: VocabEntries, translation: str, locale: str):
    template = _EXPLANATION_TEMPLATES.get(locale, _EXPLANATION_TEMPLATES['en'])
    return template(entry.word, translation, entry.example_en)


def build_vocab_question(entry: VocabEntries, distractor_pool: list[VocabEntries], locale: str, rng: random.Random):
    translation = vocab_translation(entry, locale) or vocab_translation(entry, 'ru')
    if not translation:
        return None

    others = [e for e in distractor_pool if e.id != entry.id]
    if len(others) < 3:
        return None

    distractors = rng.sample(others, 3)
    distractor_translations = [vocab_translation(d, locale) or vocab_translation(d, 'ru') for d in distractors]
    if any(t is None for t in distractor_translations):
        return None

    forward = rng.random() < 0.5
    explanation = _vocab_explanation(entry, translation, locale)

    if forward:
        options = [translation, *distractor_translations]
        rng.shuffle(options)
        return {
            'id': f'vq-{entry.id}-fwd',
            'kind': 'vocab',
            'text': f'What does "{entry.word}" mean?',
            'options': options,
            'answer': translation,
            'explanation': explanation,
        }

    options = [entry.word, *[d.word for d in distractors]]
    rng.shuffle(options)
    return {
        'id': f'vq-{entry.id}-rev',
        'kind': 'vocab',
        'text': f'Which word means "{translation}"?',
        'options': options,
        'answer': entry.word,
        'explanation': explanation,
    }


def build_vocab_questions(entries: list[VocabEntries], pool: list[VocabEntries], locale: str, rng: random.Random, count: int):
    candidates = list(entries)
    rng.shuffle(candidates)

    questions = []
    for entry in candidates:
        if len(questions) >= count:
            break
        question = build_vocab_question(entry, pool, locale, rng)
        if question is not None:
            questions.append(question)

    return questions
