import asyncio

from aiogram import Bot, Dispatcher

from app.core.config import settings
from app.models import model_achievement, model_card, model_profile, model_user  # noqa: F401
from telegram_bot.handlers import router


async def main():
    bot = Bot(token=settings.TG_BOT)
    dp = Dispatcher()
    dp.include_router(router)
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())
