from aiogram import Router
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import Message
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_profile import UserLanguages
from app.services import crud_card, ratings, streaks, telegram_link_service

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


async def _get_linked_user_id(message: Message, db):
    user_id = await telegram_link_service.get_user_id_by_chat_id(str(message.chat.id), db)

    if user_id is None:
        await message.answer('Your account is not linked. Use /start with a link from Glossa settings.')

    return user_id


@router.message(Command('level'))
async def handle_level(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)

        if user_id is None:
            return

        result = await db.execute(
            select(UserLanguages).where(UserLanguages.user_id == user_id, UserLanguages.is_target.is_(True))
        )
        language = result.scalar_one_or_none()

        if language is None:
            await message.answer('No target language set yet.')
            return

        await message.answer(f'Your level in {language.language}: {language.level}')


@router.message(Command('stats'))
async def handle_stats(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)

        if user_id is None:
            return

        stats = await crud_card.get_learning_stats(user_id, db)
        await message.answer(
            f"Words: {stats['cards_total']}\n"
            f"Learned: {stats['learned_count']}\n"
            f"Due today: {stats['due_today']}\n"
            f"Retention: {stats['retention_rate']}%"
        )


@router.message(Command('streak'))
async def handle_streak(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)

        if user_id is None:
            return

        streak = await streaks.get_streak(user_id, db)
        await message.answer(f'Current streak: {streak.current_streak} days\nBest streak: {streak.best_streak} days')


@router.message(Command('rank'))
async def handle_rank(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)

        if user_id is None:
            return

    rank_info = await ratings.get_my_rank(user_id, ratings.LEADERBOARD_GLOBAL_KEY)

    if rank_info['rank'] is None:
        await message.answer('You are not ranked yet.')
        return

    await message.answer(f"Your global rank: #{rank_info['rank']} with {rank_info['score']} XP")
