import random

ACCENT_POOL = ['en-US', 'en-GB', 'en-AU', 'en-IN', 'en-CA']

EDGE_VOICE_BY_ACCENT = {
    'en-US': 'en-US-AriaNeural',
    'en-GB': 'en-GB-SoniaNeural',
    'en-AU': 'en-AU-NatashaNeural',
    'en-IN': 'en-IN-NeerjaNeural',
    'en-CA': 'en-CA-ClaraNeural',
}

# У Piper нет отдельных моделей под en-AU/en-IN/en-CA (только en_US/en_GB в открытом наборе
# голосов) — это резервный движок на случай сбоя edge-tts, а не основной, поэтому не найденным
# акцентам подобраны разные спикеры en_US/en_GB, чтобы хотя бы голос отличался.
PIPER_VOICE_BY_ACCENT = {
    'en-US': 'en_US-amy-medium',
    'en-GB': 'en_GB-alba-medium',
    'en-AU': 'en_US-ryan-medium',
    'en-IN': 'en_US-lessac-medium',
    'en-CA': 'en_US-danny-low',
}

# Ростер из 3 акцентов на CEFR-уровень. Правило (задано один раз, не пересчитывается на
# лету): следующий уровень может повторять акценты предыдущего, но обязан добавить минимум
# один ещё не встречавшийся, пока пул из 5 не исчерпан (A1 -> A2 -> B1 вводят 3-й, 4-й, 5-й
# акцент); дальше уровни просто переиспользуют случайную тройку из уже готовых 5.
LEVEL_ACCENTS = {
    'A1': ['en-US', 'en-GB', 'en-AU'],
    'A2': ['en-GB', 'en-AU', 'en-IN'],
    'B1': ['en-AU', 'en-IN', 'en-CA'],
    'B2': ['en-US', 'en-IN', 'en-CA'],
    'C1': ['en-GB', 'en-US', 'en-CA'],
    'C2': ['en-US', 'en-AU', 'en-IN'],
    'native': ['en-GB', 'en-CA', 'en-AU'],
}

DEFAULT_LEVEL = 'A1'


def accents_for_level(level: str | None) -> list[str]:
    return LEVEL_ACCENTS.get(level or DEFAULT_LEVEL, LEVEL_ACCENTS[DEFAULT_LEVEL])


def pick_accent(level: str | None) -> str:
    return random.choice(accents_for_level(level))


def edge_voice_for_accent(accent: str) -> str:
    return EDGE_VOICE_BY_ACCENT[accent]


def piper_voice_for_accent(accent: str) -> str:
    return PIPER_VOICE_BY_ACCENT[accent]
