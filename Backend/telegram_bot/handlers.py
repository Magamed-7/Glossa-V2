from aiogram import Router
from aiogram.filters import CommandObject, CommandStart
from aiogram.types import Message

from app.db.database import AsyncSessionLocal
from app.services import telegram_link_service

router = Router()


@router.message(CommandStart())
async def handle_start(message: Message, command: CommandObject | None = None):
    code = command.args if command is not None else None

    if code:
        user_id = await telegram_link_service.resolve_link_code(code)

        if user_id is not None:
            async with AsyncSessionLocal() as db:
                await telegram_link_service.save_chat_id(user_id, str(message.chat.id), db)

            await message.answer('Your Glossa account is now linked!')
            return

        await message.answer('This link is invalid or expired. Please generate a new one from your Glossa settings.')
        return

    await message.answer('Welcome to Glossa! Use /link to connect your account.')
