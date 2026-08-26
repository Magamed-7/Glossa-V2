import logging

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 45.0

_client = AsyncOpenAI(
    api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL, timeout=REQUEST_TIMEOUT, max_retries=0,
)


async def call_llm_message(messages: list[dict], tools: list[dict] | None = None, json_mode: bool = True):
    """Returns the raw ChatCompletionMessage (has both .content and .tool_calls).

    response_format=json_object is skipped whenever tools are offered — during a
    tool-calling round the model needs to return a tool_calls array, not forced JSON;
    the caller does a follow-up call without tools once it wants the final JSON reply.
    """
    if not settings.LLM_API_KEY or not settings.LLM_MODELS:
        raise RuntimeError('No LLM provider configured — set LLM_API_KEY in .env')

    # Не передавать tools/tool_choice/response_format вообще, когда они не нужны — не None.
    # DeepSeek строго валидирует tool_choice и падает на явном null, даже если семантически
    # это "не задано".
    kwargs = {}
    if tools:
        kwargs['tools'] = tools
        kwargs['tool_choice'] = 'auto'
    elif json_mode:
        kwargs['response_format'] = {'type': 'json_object'}

    last_error = None

    for model in settings.LLM_MODELS:
        try:
            response = await _client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs,
            )
            return response.choices[0].message
        except Exception as exc:
            logger.warning('LLM model %s failed, trying next: %s', model, exc)
            last_error = exc

    raise last_error


async def call_llm(messages: list[dict], json_mode: bool = True) -> str:
    message = await call_llm_message(messages, json_mode=json_mode)
    return message.content


async def stream_llm(messages: list[dict], max_tokens: int | None = None):
    """Yield plain-text deltas as the model writes them.

    Голосовому режиму нужен не весь ответ, а первое предложение как можно раньше:
    пока модель дописывает вторую фразу, первая уже озвучивается. Поэтому здесь нет
    ни json_mode, ни tools — только текст. Перебор моделей такой же, как в
    call_llm_message, но переключиться можно лишь пока не ушёл ни один токен: после
    первого delta ответ уже частично у слушателя, и начинать заново нельзя.
    """
    if not settings.LLM_API_KEY or not settings.LLM_MODELS:
        raise RuntimeError('No LLM provider configured — set LLM_API_KEY in .env')

    kwargs = {}
    if max_tokens:
        kwargs['max_tokens'] = max_tokens

    last_error = None

    for model in settings.LLM_MODELS:
        started = False
        try:
            stream = await _client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                **kwargs,
            )
            async for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                piece = getattr(delta, 'content', None)
                if piece:
                    started = True
                    yield piece
            return
        except Exception as exc:
            if started:
                logger.exception('LLM model %s broke mid-stream', model)
                raise
            logger.warning('LLM model %s failed to start streaming, trying next: %s', model, exc)
            last_error = exc

    raise last_error
