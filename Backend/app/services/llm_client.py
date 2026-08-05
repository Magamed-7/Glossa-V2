import logging

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 45.0


def _providers():
    providers = []

    if settings.LLM_API_KEY and settings.LLM_MODELS:
        providers.append((settings.LLM_API_KEY, settings.LLM_BASE_URL, settings.LLM_MODELS))

    if settings.LLM_FALLBACK_API_KEY and settings.LLM_FALLBACK_MODELS:
        providers.append((settings.LLM_FALLBACK_API_KEY, settings.LLM_FALLBACK_BASE_URL, settings.LLM_FALLBACK_MODELS))

    return providers


async def call_llm_message(messages: list[dict], tools: list[dict] | None = None, json_mode: bool = True):
    """Returns the raw ChatCompletionMessage (has both .content and .tool_calls).

    response_format=json_object is skipped whenever tools are offered — during a
    tool-calling round the model needs to return a tool_calls array, not forced JSON;
    the caller does a follow-up call without tools once it wants the final JSON reply.
    """
    providers = _providers()

    if not providers:
        raise RuntimeError('No LLM provider configured — set LLM_API_KEY in .env')

    last_error = None

    for api_key, base_url, models in providers:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=REQUEST_TIMEOUT, max_retries=2)

        for model in models:
            # Не передавать tools/tool_choice/response_format вообще, когда они не нужны —
            # не None. Groq строго валидирует tool_choice и падает 400 на явном null, даже
            # если семантически это "не задано" (баг, живьём: раньше здесь стояло
            # `tool_choice='auto' if tools else None`, что ломало финальный вызов после
            # раунда с инструментами на каждой модели в цепочке).
            kwargs = {}
            if tools:
                kwargs['tools'] = tools
                kwargs['tool_choice'] = 'auto'
            elif json_mode:
                kwargs['response_format'] = {'type': 'json_object'}

            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    **kwargs,
                )
                return response.choices[0].message
            except Exception as exc:
                logger.warning('LLM model %s (%s) failed, trying next: %s', model, base_url, exc)
                last_error = exc

    raise last_error


async def call_llm(messages: list[dict], json_mode: bool = True) -> str:
    message = await call_llm_message(messages, json_mode=json_mode)
    return message.content
