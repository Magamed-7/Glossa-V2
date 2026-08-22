import asyncio
import logging

from app.core.tts_voices import edge_voice_for_text, piper_voice_for_accent

logger = logging.getLogger(__name__)

EDGE_TTS_ATTEMPTS = 2
# A voiced reply is only useful while the learner is still waiting for it, so a
# flaky call is retried once and quickly rather than three times over 4.5s.
EDGE_TTS_RETRY_DELAY_SECONDS = 0.4


async def _synthesize_edge_once(text: str, voice: str) -> bytes:
    import edge_tts

    communicate = edge_tts.Communicate(text, voice)
    chunks = bytearray()

    async for chunk in communicate.stream():
        if chunk['type'] == 'audio':
            chunks.extend(chunk['data'])

    if not chunks:
        raise RuntimeError('edge-tts returned no audio data')

    return bytes(chunks)


async def _synthesize_edge(text: str, voice: str) -> bytes:
    # Под конкурентной нагрузкой edge-tts (недокументированный сервис Microsoft) иногда рвёт
    # соединение — это временный сбой сети, а не «сервис умер», поэтому пробуем несколько раз
    # с паузой, прежде чем считать его недоступным и уходить на Piper.
    last_error = None

    for attempt in range(EDGE_TTS_ATTEMPTS):
        try:
            return await _synthesize_edge_once(text, voice)
        except Exception as exc:
            last_error = exc
            if attempt < EDGE_TTS_ATTEMPTS - 1:
                await asyncio.sleep(EDGE_TTS_RETRY_DELAY_SECONDS * (attempt + 1))

    raise last_error


def _synthesize_piper(text: str, voice: str) -> bytes:
    import io
    import wave
    from pathlib import Path

    from piper import PiperVoice
    from piper.download_voices import download_voice

    from app.core.config import settings

    download_dir = Path(settings.PIPER_VOICES_DIR)
    download_dir.mkdir(parents=True, exist_ok=True)
    model_path = download_dir / f'{voice}.onnx'

    if not model_path.exists():
        download_voice(voice, download_dir)

    piper_voice = PiperVoice.load(model_path)

    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        piper_voice.synthesize_wav(text, wav_file)

    return buffer.getvalue()


class VoiceUnavailable(Exception):
    """Ни один движок не смог озвучить текст."""


async def synthesize(text: str, accent: str) -> tuple[bytes, str]:
    """Returns (audio_bytes, content_type) — edge-tts produces mp3, Piper (fallback) wav."""
    edge_voice = edge_voice_for_text(text, accent)

    try:
        return await _synthesize_edge(text, edge_voice), 'audio/mpeg'
    except Exception:
        logger.exception('edge-tts failed for %r (%s), falling back to Piper', text, accent)

    # Piper — необязательный запасной движок, в образе его может не быть. Раньше его
    # отсутствие всплывало наружу как ModuleNotFoundError и превращалось в «что-то пошло
    # не так на нашей стороне»: вместо понятного «голос недоступен» человек получал
    # ошибку сервера.
    piper_voice = piper_voice_for_accent(accent)
    try:
        audio_bytes = await asyncio.to_thread(_synthesize_piper, text, piper_voice)
    except ModuleNotFoundError as exc:
        raise VoiceUnavailable('запасной движок озвучки не установлен') from exc
    except Exception as exc:
        raise VoiceUnavailable('движки озвучки не смогли прочитать текст') from exc

    return audio_bytes, 'audio/wav'
