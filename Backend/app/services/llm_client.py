import logging

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 45.0


def _providers():
    providers = []

    if settings.LLM_API_KEY:
        providers.append((settings.LLM_API_KEY, settings.LLM_BASE_URL, settings.LLM_MODEL))

    if settings.LLM_FALLBACK_API_KEY:
        providers.append(
            (settings.LLM_FALLBACK_API_KEY, settings.LLM_FALLBACK_BASE_URL, settings.LLM_FALLBACK_MODEL)
        )

    return providers


async def call_llm(messages: list[dict], json_mode: bool = True) -> str:
    providers = _providers()

    if not providers:
        raise RuntimeError('No LLM provider configured — set LLM_API_KEY in .env')

    last_error = None

    for api_key, base_url, model in providers:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=REQUEST_TIMEOUT, max_retries=2)

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={'type': 'json_object'} if json_mode else None,
            )
            return response.choices[0].message.content
        except Exception as exc:
            logger.warning('LLM provider %s (%s) failed, trying next: %s', model, base_url, exc)
            last_error = exc

    raise last_error
