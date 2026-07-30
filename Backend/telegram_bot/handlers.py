from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

router = Router()


@router.message(CommandStart())
async def handle_start(message: Message):
    await message.answer('Welcome to Glossa! Use /link to connect your account.')
