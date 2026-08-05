import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from openai import APITimeoutError, RateLimitError

from app.core.errors import AppError
from app.core.limits import add_ai_seconds, check_ai_access
from app.core.security import decode_access_token
from app.db.database import AsyncSessionLocal
from app.services import ai_chat, ai_mcp, crud_user

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ai_chat.send_message зовёт MCP-инструменты (реальная колода/прогресс ученика) — это
    # отдельный процесс от app.main (там свой ai_mcp.connect() в своём lifespan), поэтому
    # у websocket_app должен быть свой собственный подключённый клиент, не общий с ним.
    await ai_mcp.connect()
    yield
    await ai_mcp.disconnect()


app = FastAPI(title='Glossa WebSocket AI Chat', lifespan=lifespan)

TICK_SECONDS = 10
# DB-запись seconds_spent и проверка лимита — не каждый тик (было 4 обращения к БД/Redis в
# секунду на каждое открытое соединение), а раз в ~DB_SYNC_EVERY_N_TICKS * TICK_SECONDS секунд.
# Сам счётчик в Redis (add_ai_seconds) остаётся точным каждый тик — лимит проверяется по нему.
DB_SYNC_EVERY_N_TICKS = 6


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


def _log_ticker_exception(task: asyncio.Task):
    if task.cancelled():
        return

    exc = task.exception()
    if exc is not None:
        logger.error('AI chat ticker task ended with an unhandled exception', exc_info=exc)


async def tick_session_time(websocket: WebSocket, user_id: int, session_id: int):
    tick_count = 0
    accumulated_seconds = 0

    async def flush(seconds: int):
        if seconds <= 0:
            return

        try:
            async with AsyncSessionLocal() as db:
                session = await ai_chat.get_session(session_id, db)
                if session is not None:
                    session.seconds_spent += seconds
                    await db.commit()
        except Exception:
            logger.exception('Failed to flush AI chat seconds for session %s', session_id)

    try:
        while True:
            await asyncio.sleep(TICK_SECONDS)
            tick_count += 1
            accumulated_seconds += TICK_SECONDS

            try:
                await add_ai_seconds(user_id, TICK_SECONDS)
            except Exception:
                logger.exception('Failed to add AI seconds for user %s', user_id)

            if tick_count % DB_SYNC_EVERY_N_TICKS != 0:
                continue

            try:
                async with AsyncSessionLocal() as db:
                    session = await ai_chat.get_session(session_id, db)

                    # Раньше это было AttributeError на следующей строке, тихо убивавший
                    # тикер — билинг времени переставал списываться навсегда, никто не видел.
                    if session is None:
                        logger.warning('AI chat session %s vanished mid-tick, stopping ticker', session_id)
                        return

                    session.seconds_spent += accumulated_seconds
                    await db.commit()
                    accumulated_seconds = 0

                    try:
                        await check_ai_access(user_id, db)
                    except AppError as exc:
                        await websocket.send_json({'type': 'limit_reached', 'message': exc.message})
                        await websocket.close(code=4403, reason=exc.message)
                        return
            except Exception:
                logger.exception('AI chat ticker DB sync failed for session %s', session_id)
    finally:
        # Финальная синхронизация ещё не сброшенных секунд при закрытии сокета — иначе до
        # DB_SYNC_EVERY_N_TICKS * TICK_SECONDS последних секунд разговора потерялись бы.
        await flush(accumulated_seconds)


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
        native_language = websocket.query_params.get('native_language')
        # Свежую (в пределах SESSION_FRESHNESS) сессию переиспользуем вместо новой на каждый
        # коннект — иначе история чата живёт только в React-state и пропадает на F5.
        session = await ai_chat.get_or_create_open_session(
            user.id, scenario, language, db, native_language=native_language
        )
        history = await ai_chat.get_session_messages(session.id, db)

        await websocket.send_json({
            'type': 'session_started',
            'session_id': session.id,
            'messages': [
                {
                    'role': message.role,
                    'text': message.text,
                    'corrections': message.corrections,
                    'encouragement': message.encouragement,
                }
                for message in history
            ],
        })

    ticker = asyncio.create_task(tick_session_time(websocket, user.id, session.id))
    ticker.add_done_callback(_log_ticker_exception)

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
                'encouragement': result['assistant_message'].encouragement,
                'corrections': result['user_message'].corrections,
            })
    except WebSocketDisconnect:
        pass
    finally:
        ticker.cancel()
