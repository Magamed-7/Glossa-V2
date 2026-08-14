import asyncio

from aiogram import Bot, Dispatcher

from app.core.config import settings
from app.models import model_achievement, model_card, model_profile, model_user  # noqa: F401
from telegram_bot.handlers import router


async def main():
    bot = Bot(token=settings.TG_BOT)
    
    # Set localized bot commands in menu
    from aiogram.types import BotCommand
    
    # English commands (default)
    await bot.set_my_commands([
        BotCommand(command="start", description="Restart or link your Glossa account"),
        BotCommand(command="stats", description="Show vocabulary learning statistics"),
        BotCommand(command="streak", description="Check your current active study streak"),
        BotCommand(command="rank", description="Check your rank on the global leaderboard"),
        BotCommand(command="level", description="Check target language proficiency level"),
        BotCommand(command="achievements", description="View list of your earned badges"),
        BotCommand(command="language", description="Change Telegram bot language"),
        BotCommand(command="settings", description="Configure SM-2 spaced repetition reminders"),
        BotCommand(command="ai", description="Enter chat mode with AI Tutor"),
        BotCommand(command="help", description="Show detailed help guide"),
        BotCommand(command="exit", description="Leave AI Tutor chat mode"),
    ])
    
    # Russian commands
    await bot.set_my_commands([
        BotCommand(command="start", description="Перезапустить или привязать аккаунт Glossa"),
        BotCommand(command="stats", description="Показать статистику изученных слов"),
        BotCommand(command="streak", description="Проверить ударную серию дней обучения"),
        BotCommand(command="rank", description="Узнать место в глобальном рейтинге"),
        BotCommand(command="level", description="Показать уровень целевого языка"),
        BotCommand(command="achievements", description="Посмотреть заработанные награды"),
        BotCommand(command="language", description="Сменить язык общения с ботом"),
        BotCommand(command="settings", description="Настроить напоминания по методу SM-2"),
        BotCommand(command="ai", description="Войти в чат с ИИ-Репетитором"),
        BotCommand(command="help", description="Показать подробную справку по командам"),
        BotCommand(command="exit", description="Выйти из режима общения с ИИ"),
    ], language_code="ru")
    
    # Tajik commands
    await bot.set_my_commands([
        BotCommand(command="start", description="Аз нав оғоз кардан ё пайваст кардани ҳисоб"),
        BotCommand(command="stats", description="Нишон додани омори калимаҳо"),
        BotCommand(command="streak", description="Санҷиши силсилаи рӯзҳои фаъолият"),
        BotCommand(command="rank", description="Ҷой дар рейтинги умумии ҷаҳонӣ"),
        BotCommand(command="level", description="Намоиши сатҳи забони интихобшуда"),
        BotCommand(command="achievements", description="Дидани дастовардҳо ва нишонҳо"),
        BotCommand(command="language", description="Иваз кардани забони интерфейси бот"),
        BotCommand(command="settings", description="Танзимоти ёддоварӣ бо усули SM-2"),
        BotCommand(command="ai", description="Ворид шудан ба чат бо ИИ-Репетитор"),
        BotCommand(command="help", description="Нишон додани дастури муфассали фармонҳо"),
        BotCommand(command="exit", description="Баромадан аз реҷаи чат бо ИИ"),
    ], language_code="tg")

    dp = Dispatcher()
    dp.include_router(router)
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())
