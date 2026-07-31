import re

from mcp_server.instance import mcp

LATIN_RE = re.compile(r'[A-Za-z]')
CYRILLIC_RE = re.compile(r'[А-Яа-яЁёӢӣӮӯҚқҒғҲҳҶҷ]')


@mcp.tool()
def check_text(text: str, language: str) -> dict:
    """Run lightweight rule-based checks on user text and return a flagged-issue structure for LLM correction."""
    stripped = text.strip()

    if not stripped:
        return {
            'is_empty': True,
            'word_count': 0,
            'char_count': 0,
            'likely_language_mismatch': False,
            'flags': [{'type': 'empty_text', 'detail': 'Text is empty'}],
        }

    words = stripped.split()
    flags = []

    latin_chars = len(LATIN_RE.findall(stripped))
    cyrillic_chars = len(CYRILLIC_RE.findall(stripped))
    likely_language_mismatch = False

    if language in ('en', 'english') and cyrillic_chars > latin_chars:
        likely_language_mismatch = True
        flags.append({'type': 'language_mismatch', 'detail': f'Expected {language}, text looks Cyrillic'})

    for previous, current in zip(words, words[1:]):
        if previous.lower() == current.lower():
            flags.append({'type': 'repeated_word', 'detail': f'Repeated word: "{current}"'})

    return {
        'is_empty': False,
        'word_count': len(words),
        'char_count': len(stripped),
        'likely_language_mismatch': likely_language_mismatch,
        'flags': flags,
    }
