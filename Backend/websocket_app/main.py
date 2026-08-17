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
from app.schemas.schema_messenger import MessageResponse
from app.services import ai_chat, ai_mcp, crud_messenger, crud_notification, crud_user, streaks

from app.core.redis_client import redis_client

logger = logging.getLogger(__name__)


class LeaderboardManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_update(self):
        for connection in list(self.active_connections):
            try:
                await connection.send_json({'type': 'update'})
            except Exception:
                pass


leaderboard_manager = LeaderboardManager()


async def listen_leaderboard_updates():
    pubsub = redis_client.pubsub()
    await pubsub.subscribe('leaderboard_updates')
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                await leaderboard_manager.broadcast_update()
            await asyncio.sleep(0.5)
    except asyncio.CancelledError:
        pass
    except Exception:
        logger.exception('Error in leaderboard pubsub listener')
    finally:
        await pubsub.unsubscribe('leaderboard_updates')


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ai_chat.send_message зовёт MCP-инструменты (реальная колода/прогресс ученика) — это
    # отдельный процесс от app.main (там свой ai_mcp.connect() в своём lifespan), поэтому
    # у websocket_app должен быть свой собственный подключённый клиент, не общий с ним.
    await ai_mcp.connect()
    listener_task = asyncio.create_task(listen_leaderboard_updates())
    yield
    listener_task.cancel()
    try:
        await listener_task
    except asyncio.CancelledError:
        pass
    await ai_mcp.disconnect()


app = FastAPI(title='Glossa WebSocket AI Chat & Leaderboard', lifespan=lifespan)

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
        tutor = websocket.query_params.get('tutor', 'rose')
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
                    result = await ai_chat.send_message(session.id, text, db, tutor=tutor)
            except Exception as exc:
                logger.exception('AI chat send_message failed for session %s', session.id)
                await websocket.send_json(_assistant_error_frame(exc))
                continue

            await websocket.send_json({
                'type': 'message',
                'reply': result['assistant_message'].text,
                'corrections': result['user_message'].corrections,
                'xp_earned': result['xp_earned'],
                'audio_url': result.get('audio_url'),
            })
    except WebSocketDisconnect:
        pass
    finally:
        ticker.cancel()


@app.websocket('/ws/streak')
async def streak_ws(websocket: WebSocket):
    from datetime import date, timedelta
    await websocket.accept()
    async with AsyncSessionLocal() as db:
        user = await authenticate(websocket, db)
        if user is None:
            await websocket.close(code=4401, reason='Authentication required')
            return

        try:
            # Touch the streak on connection/visit!
            streak_obj = await streaks.touch_streak(user.id, db)
            
            # Determine if it's maintained
            today = date.today()
            streak_maintained = False
            if streak_obj.last_activity_date:
                if streak_obj.last_activity_date == today or streak_obj.last_activity_date == today - timedelta(days=1):
                    streak_maintained = True

            # If user has a saved prev_streak_before_reset that was reset, they are in a broken (restorable) state
            if streak_obj.prev_streak_before_reset > streak_obj.current_streak:
                streak_maintained = False

            # Send initial streak data immediately
            await websocket.send_json({
                'type': 'streak_update',
                'streak': streak_obj.current_streak,
                'streak_maintained': streak_maintained,
                'prev_streak': streak_obj.prev_streak_before_reset
            })

            # Keep connection open
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        except Exception:
            logger.exception("Error in streak websocket")


@app.websocket('/ws/leaderboard')
async def leaderboard_ws(websocket: WebSocket):
    await leaderboard_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        leaderboard_manager.disconnect(websocket)


class MessengerManager:
    # Один пользователь может держать несколько вкладок/устройств одновременно — поэтому
    # набор сокетов на user_id, а не один сокет.
    def __init__(self):
        self.connections: dict[int, set[WebSocket]] = {}

    def connect(self, user_id: int, websocket: WebSocket):
        self.connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        sockets = self.connections.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            del self.connections[user_id]

    def is_online(self, user_id: int):
        return bool(self.connections.get(user_id))

    async def send_to_user(self, user_id: int, data: dict):
        for connection in list(self.connections.get(user_id, ())):
            try:
                await connection.send_json(data)
            except Exception:
                pass


messenger_manager = MessengerManager()

CALL_SIGNAL_TYPES = {'call_offer', 'call_answer', 'ice_candidate', 'call_end'}


@app.websocket('/ws/messenger')
async def messenger_ws(websocket: WebSocket):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        user = await authenticate(websocket, db)

    if user is None:
        await websocket.close(code=4401, reason='Authentication required')
        return

    messenger_manager.connect(user.id, websocket)

    try:
        while True:
            try:
                data = await websocket.receive_json()
            except json.JSONDecodeError:
                await websocket.send_json({'type': 'error', 'code': 'BAD_MESSAGE'})
                continue

            msg_type = data.get('type')
            conversation_id = data.get('conversation_id')

            if conversation_id is None:
                await websocket.send_json({'type': 'error', 'code': 'MISSING_CONVERSATION_ID'})
                continue

            async with AsyncSessionLocal() as db:
                participant_ids = await crud_messenger.get_participant_ids(conversation_id, db)

                if user.id not in participant_ids:
                    await websocket.send_json({'type': 'error', 'code': 'NOT_A_PARTICIPANT'})
                    continue

                other_ids = [pid for pid in participant_ids if pid != user.id]

                if msg_type == 'send_message':
                    message = await crud_messenger.create_message(
                        conversation_id,
                        user.id,
                        db,
                        type=data.get('message_type', 'text'),
                        text=data.get('text'),
                        attachment_url=data.get('attachment_url'),
                        attachment_name=data.get('attachment_name'),
                        attachment_duration_seconds=data.get('attachment_duration_seconds'),
                    )
                    payload = {
                        'type': 'new_message',
                        'message': MessageResponse.model_validate(message).model_dump(mode='json'),
                    }
                    await websocket.send_json(payload)

                    for other_id in other_ids:
                        if messenger_manager.is_online(other_id):
                            await messenger_manager.send_to_user(other_id, payload)
                        else:
                            preview = message.text if message.type == 'text' else f'[{message.type}]'
                            await crud_notification.create_notification(
                                other_id, 'new_message', f'{user.username}',
                                db, body=(preview or '')[:200],
                            )

                elif msg_type == 'typing':
                    for other_id in other_ids:
                        await messenger_manager.send_to_user(
                            other_id, {'type': 'typing', 'conversation_id': conversation_id, 'user_id': user.id}
                        )

                elif msg_type in CALL_SIGNAL_TYPES:
                    relay = {**data, 'from_user_id': user.id}
                    for other_id in other_ids:
                        await messenger_manager.send_to_user(other_id, relay)

                    if msg_type == 'call_end' and data.get('log') is not False:
                        await crud_messenger.create_message(
                            conversation_id,
                            user.id,
                            db,
                            type='call',
                            text=data.get('status', 'ended'),
                            attachment_duration_seconds=data.get('duration_seconds'),
                        )

                else:
                    await websocket.send_json({'type': 'error', 'code': 'UNKNOWN_TYPE'})
    except WebSocketDisconnect:
        pass
    finally:
        messenger_manager.disconnect(user.id, websocket)
