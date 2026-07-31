import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.core.errors import AppError
from app.core.limits import add_ai_seconds, check_ai_access
from app.core.security import decode_access_token
from app.db.database import AsyncSessionLocal
from app.services import ai_chat, crud_user

app = FastAPI(title='Glossa WebSocket AI Chat')

TICK_SECONDS = 1


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
            data = await websocket.receive_json()
            text = data.get('text', '')

            async with AsyncSessionLocal() as db:
                result = await ai_chat.send_message(session.id, text, db)

            await websocket.send_json({
                'type': 'message',
                'reply': result['assistant_message'].text,
                'corrections': result['user_message'].corrections,
            })
    except WebSocketDisconnect:
        pass
    finally:
        ticker.cancel()
