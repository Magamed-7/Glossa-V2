from openai import AsyncOpenAI

from app.core.config import settings


def get_client():
    return AsyncOpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)


async def call_llm(messages: list[dict], json_mode: bool = True):
    client = get_client()

    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
        response_format={'type': 'json_object'} if json_mode else None,
    )

    return response.choices[0].message.content
