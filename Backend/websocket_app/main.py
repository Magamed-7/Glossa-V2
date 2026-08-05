import asyncio
import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from openai import APITimeoutError, RateLimitError

from app.core.errors import AppError
from app.core.limits import add_ai_seconds, check_ai_access
from app.core.security import decode_access_token
from app.db.database import AsyncSessionLocal
from app.services import ai_chat, crud_user

logger = logging.getLogger(__name__)

app = FastAPI(title='Glossa WebSocket AI Chat')

TICK_SECONDS = 1


def _assistant_error_frame(exc: Exception):
    if isinstance(exc, RateLimitError):
        code = 'AI_RATE_LIMITED'
    elif isinstance(exc, APITimeoutError):
        code = 'AI_TIMEOUT'
    else:
        code = 'AI_TEMPORARILY_UNAVAILABLE'

    return {'type': 'assistant_error', 'code': code}


async def authenticate(websocket: WebSocket, db):
    token = websocket.query_params.get('token')

    if token is None:
        return None

    payload = decode_access_token(token)

    if payload is None:
        return None

    user_id = payload.get('user_id')

    if user_id is None:
        return None

    user = await crud_user.get_by_id(int(user_id), db)

    if user is None or not user.is_active:
        return None

    return user


async def tick_session_time(websocket: WebSocket, user_id: int, session_id: int):
    while True:
        await asyncio.sleep(TICK_SECONDS)

        async with AsyncSessionLocal() as db:
            await add_ai_seconds(user_id, TICK_SECONDS)

            session = await ai_chat.get_session(session_id, db)
            session.seconds_spent += TICK_SECONDS
            await db.commit()

            try:
                await check_ai_access(user_id, db)
            except AppError as exc:
                await websocket.send_json({'type': 'limit_reached', 'message': exc.message})
                await websocket.close(code=4403, reason=exc.message)
                return


@app.websocket('/ws/ai/chat')
async def ai_chat_ws(websocket: WebSocket):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        user = await authenticate(websocket, db)

        if user is None:
            await websocket.close(code=4401, reason='Authentication required')
            return

        try:
            await check_ai_access(user.id, db)
        except AppError as exc:
            await websocket.close(code=4403, reason=exc.message)
            return

        scenario = websocket.query_params.get('scenario', 'casual')
        language = websocket.query_params.get('language', 'English')
        session = await ai_chat.create_session(user.id, scenario, language, db)

        await websocket.send_json({'type': 'session_started', 'session_id': session.id})

    ticker = asyncio.create_task(tick_session_time(websocket, user.id, session.id))

    try:
        while True:
            try:
                data = await websocket.receive_json()
            except json.JSONDecodeError:
                await websocket.send_json({'type': 'assistant_error', 'code': 'BAD_MESSAGE'})
                continue

            text = data.get('text', '')

            try:
                async with AsyncSessionLocal() as db:
                    result = await ai_chat.send_message(session.id, text, db)
            except Exception as exc:
                logger.exception('AI chat send_message failed for session %s', session.id)
                await websocket.send_json(_assistant_error_frame(exc))
                continue

            await websocket.send_json({
                'type': 'message',
                'reply': result['assistant_message'].text,
                'corrections': result['user_message'].corrections,
            })
    except WebSocketDisconnect:
        pass
    finally:
        ticker.cancel()
