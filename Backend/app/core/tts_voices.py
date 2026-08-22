import random
import re

ACCENT_POOL = ['en-US', 'en-GB', 'en-AU', 'en-IN', 'en-CA']

EDGE_VOICE_BY_ACCENT = {
    'en-US': 'en-US-AriaNeural',
    'en-GB': 'en-GB-SoniaNeural',
    'en-AU': 'en-AU-NatashaNeural',
    'en-IN': 'en-IN-NeerjaNeural',
    'en-CA': 'en-CA-ClaraNeural',
    # Tutor specific voice mappings (US/GB, Indian, Russian accents)
    'rose': 'en-US-JennyNeural',       # Anya: soft US female
    'mint': 'en-US-GuyNeural',         # Kenzo: US Male
    'lavender': 'en-IN-NeerjaNeural',   # Priya: Indian Female
    'peach': 'en-US-BrianNeural',      # Carlos: US Male 2
    'sky': 'en-GB-RyanNeural',         # Alastair: British Male
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
    # Tutor specific fallbacks
    'rose': 'en_US-amy-medium',
    'mint': 'en_US-ryan-medium',
    'lavender': 'en_US-lessac-medium',
    'peach': 'en_US-danny-low',
    'sky': 'en_GB-alba-medium',
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


# У Microsoft нет ни одного таджикского голоса — проверено, ноль из 322. Таджикский
# пишется кириллицей, поэтому кириллический текст читает русский голос: это не родное
# произношение, зато наставника слышно. Раньше кириллицу пытался прочесть английский
# голос, речевой сервис не возвращал ничего, и запрос падал с ошибкой.
RUSSIAN_VOICE_BY_TUTOR = {
    'rose': 'ru-RU-SvetlanaNeural',
    'mint': 'ru-RU-DmitryNeural',
    'lavender': 'ru-RU-SvetlanaNeural',
    'peach': 'ru-RU-DmitryNeural',
    'sky': 'ru-RU-DmitryNeural',
}

DEFAULT_ACCENT = 'en-US'
DEFAULT_RUSSIAN_VOICE = 'ru-RU-SvetlanaNeural'

_CYRILLIC = re.compile(r'[Ѐ-ӿ]')
_LETTER = re.compile(r'[^\W\d_]', re.UNICODE)


def is_cyrillic(text: str) -> bool:
    """Написан ли текст кириллицей. Считаем по буквам, знаки и цифры не в счёт."""
    letters = _LETTER.findall(text or '')
    if not letters:
        return False
    cyrillic = sum(1 for letter in letters if _CYRILLIC.match(letter))
    return cyrillic * 2 > len(letters)


def edge_voice_for_accent(accent: str) -> str:
    return EDGE_VOICE_BY_ACCENT.get(accent, EDGE_VOICE_BY_ACCENT[DEFAULT_ACCENT])


def edge_voice_for_text(text: str, accent: str) -> str:
    """Голос под текст: кириллицу читает русский голос того же пола, что и наставник."""
    if is_cyrillic(text):
        return RUSSIAN_VOICE_BY_TUTOR.get(accent, DEFAULT_RUSSIAN_VOICE)
    return edge_voice_for_accent(accent)


def piper_voice_for_accent(accent: str) -> str:
    return PIPER_VOICE_BY_ACCENT.get(accent, PIPER_VOICE_BY_ACCENT[DEFAULT_ACCENT])
