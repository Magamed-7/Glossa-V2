import time
from datetime import datetime

from aiogram import Router, F
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton
from sqlalchemy import select

from app.core.errors import AppError
from app.core.limits import add_ai_seconds, check_ai_access
from app.core.redis_client import redis_client
from app.db.database import AsyncSessionLocal
from app.models.model_profile import UserProfiles, UserLanguages
from app.models.model_achievement import UserAchievements, Achievements
from app.services import ai_chat, crud_card, ratings, streaks, telegram_link_service

router = Router()

# ─── TRANSLATIONS FOR THREE LANGUAGES (EN/RU/TG) ───
BOT_TRANSLATIONS = {
    'en': {
        'welcome_linked': 'Your Glossa account is now successfully linked! 🚀 Welcome to your mobile companion.',
        'invalid_code': 'This link is invalid or expired. Please generate a new one from your Glossa settings.',
        'welcome': 'Welcome to Glossa! Use the menu below or type /link to connect your account.',
        'not_linked': 'Your account is not linked. Please visit Glossa settings on the website to link Telegram.',
        'no_target_lang': 'No target language set yet.',
        'level_msg': 'Your level in {lang}: {level}',
        'stats_msg': '📝 *Your Vocabulary Stats*:\n\n• Total Words: {total}\n• Learned: {learned}\n• Due today: {due}\n• Retention rate: {retention}%',
        'streak_msg': '🔥 *Current Streak*: {current} days\n🏆 *Best Streak*: {best} days',
        'rank_msg': '🏆 *Global Rank*: #{rank} with {score} XP',
        'ai_intro': '💬 *AI Tutor Chat Mode* is now active!\nSend any message directly, and I will reply as your AI Tutor. Type /exit or click the button below to return to the main menu.',
        'ai_exit': 'Left AI Chat. You are now back in the main menu.',
        'help': 'Available commands:\n• /stats - Vocabulary stats\n• /streak - Active learning days\n• /rank - Leaderboard rank\n• /level - Language level\n• /ai - Converse with AI\n• /achievements - View earned badges\n• /exit - Exit chat mode',
        'achievements_title': '🏅 *Your Earned Achievements*:\n',
        'no_achievements': 'You haven\'t earned any achievements yet. Keep studying on the site to unlock badges!',
        'achievement_item': '• *{title}* - {desc}\n  _Earned on: {date}_',
        'btn_stats': '📝 Словарь / Stats',
        'btn_streak': '🔥 Серия / Streak',
        'btn_rank': '🏆 Рейтинг / Rank',
        'btn_ai': '💬 ИИ Репетитор / AI Chat',
        'btn_achievements': '🏅 Достижения / Achievements',
        'btn_help': '❓ Справка / Help',
        'btn_exit': '❌ Выйти из чата / Exit Chat',
    },
    'ru': {
        'welcome_linked': 'Ваш аккаунт Glossa успешно подключен! 🚀 Добро пожаловать.',
        'invalid_code': 'Эта ссылка недействительна или устарела. Создайте новую в настройках Glossa на сайте.',
        'welcome': 'Добро пожаловать в Glossa! Используйте меню ниже или команду /link для подключения аккаунта.',
        'not_linked': 'Ваш аккаунт не подключен. Пожалуйста, зайдите в настройки на сайте Glossa и привяжите Telegram.',
        'no_target_lang': 'Целевой язык еще не выбран.',
        'level_msg': 'Ваш уровень в {lang}: {level}',
        'stats_msg': '📝 *Ваша статистика*:\n\n• Всего слов: {total}\n• Изучено: {learned}\n• К повторению сегодня: {due}\n• Коэффициент удержания: {retention}%',
        'streak_msg': '🔥 *Текущая серия*: {current} дн.\n🏆 *Лучшая серия*: {best} дн.',
        'rank_msg': '🏆 *Мировой рейтинг*: #{rank} с {score} XP',
        'ai_intro': '💬 *Режим общения с ИИ-Репетитором* активен!\nОтправьте любое сообщение, и я отвечу вам как ИИ-Репетитор. Введите /exit или нажмите кнопку ниже, чтобы выйти.',
        'ai_exit': 'Вы вышли из чата с ИИ. Вы вернулись в главное меню.',
        'help': 'Доступные команды:\n• /stats - Статистика словаря\n• /streak - Серия дней занятий\n• /rank - Место в рейтинге\n• /level - Уровень языка\n• /ai - Общение с ИИ\n• /achievements - Ваши награды\n• /exit - Выйти из чата',
        'achievements_title': '🏅 *Ваши достижения*:\n',
        'no_achievements': 'Вы еще не заработали ни одной награды. Занимайтесь на сайте, чтобы разблокировать значки!',
        'achievement_item': '• «*{title}*» - {desc}\n  _Получено: {date}_',
        'btn_stats': '📝 Словарь / Статистика',
        'btn_streak': '🔥 Серия дней',
        'btn_rank': '🏆 Рейтинг',
        'btn_ai': '💬 ИИ-Репетитор',
        'btn_achievements': '🏅 Награды',
        'btn_help': '❓ Справка',
        'btn_exit': '❌ Выйти из чата',
    },
    'tg': {
        'welcome_linked': 'Ҳисоби Glossa-и шумо бомуваффақият пайваст шуд! 🚀 Хуш омадед.',
        'invalid_code': 'Ин пайванд нодуруст аст ё мӯҳлаташ гузаштааст. Пайванди навро аз танзимоти Glossa гиред.',
        'welcome': 'Ба Glossa хуш омадед! Аз менюи зер истифода баред ё фармони /link-ро барои пайвастшавӣ фиристед.',
        'not_linked': 'Ҳисоби шумо пайваст нест. Лутфан ба танзимоти сомонаи Glossa даромада, Telegram-ро пайваст кунед.',
        'no_target_lang': 'Забони омӯхташаванда ҳанӯз интихоб нашудааст.',
        'level_msg': 'Сатҳи шумо дар {lang}: {level}',
        'stats_msg': '📝 *Омори луғати шумо*:\n\n• Шумораи калимаҳо: {total}\n• Омӯхташуда: {learned}\n• Барои такрор имрӯз: {due}\n• Сатҳи нигоҳдорӣ: {retention}%',
        'streak_msg': '🔥 *Силсилаи ҷорӣ*: {current} рӯз\n🏆 *Силсилаи беҳтарин*: {best} рӯз',
        'rank_msg': '🏆 *Рейтинги ҷаҳонӣ*: #{rank} бо {score} XP',
        'ai_intro': '💬 *Реҷаи гуфтугӯ бо ИИ-Репетитор* фаъол шуд!\nҲар паёме фиристед, ман ҳамчун ИИ-Репетитор ҷавоб медиҳам. Барои баромадан /exit ё тугмаи зерро пахш кунед.',
        'ai_exit': 'Шумо аз чати ИИ баромадед. Бозгашт ба менюи асосӣ.',
        'help': 'Фармонҳои дастрас:\n• /stats - Омори луғат\n• /streak - Силсилаи рӯзҳо\n• /rank - Ҷойи шумо дар рейтинг\n• /level - Сатҳи забон\n• /ai - Чат бо ИИ\n• /achievements - Дастовардҳо\n• /exit - Баромадан аз чат',
        'achievements_title': '🏅 *Дастовардҳои шумо*:\n',
        'no_achievements': 'Шумо ҳанӯз ягон нишон ба даст наовардаед. Барои кушодани нишонҳо дар сомона дарс хонед!',
        'achievement_item': '• *{title}* - {desc}\n  _Санаи ба даст овардан: {date}_',
        'btn_stats': '📝 Луғат / Омор',
        'btn_streak': '🔥 Силсилаи рӯзҳо',
        'btn_rank': '🏆 Рейтинг',
        'btn_ai': '💬 ИИ-Репетитор',
        'btn_achievements': '🏅 Дастовардҳо',
        'btn_help': '❓ Роҳнамо',
        'btn_exit': '❌ Баромадан аз чат',
    }
}


# ─── HELPER KEYBOARDS ───
def get_main_keyboard(locale: str) -> ReplyKeyboardMarkup:
    t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
    kb = [
        [KeyboardButton(text=t['btn_stats']), KeyboardButton(text=t['btn_streak'])],
        [KeyboardButton(text=t['btn_rank']), KeyboardButton(text=t['btn_achievements'])],
        [KeyboardButton(text=t['btn_ai']), KeyboardButton(text=t['btn_help'])]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)


def get_chat_keyboard(locale: str) -> ReplyKeyboardMarkup:
    t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
    kb = [
        [KeyboardButton(text=t['btn_exit'])]
    ]
    return ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)


# ─── DYNAMIC LOCALE RETRIEVAL ───
async def _get_locale(user_id: int, db) -> str:
    from app.services import crud_settings
    try:
        settings = await crud_settings.get_settings(user_id, db)
        loc = getattr(settings, 'interface_language', 'en')
        return loc if loc in ('en', 'ru', 'tg') else 'en'
    except Exception:
        return 'en'


async def _get_linked_user_id(message: Message, db):
    user_id = await telegram_link_service.get_user_id_by_chat_id(str(message.chat.id), db)
    if user_id is None:
        # Default to Russian for default warning if not linked
        await message.answer(BOT_TRANSLATIONS['ru']['not_linked'])
    return user_id


# ─── COMMAND START (LINK RESOLUTION) ───
@router.message(CommandStart())
async def handle_start(message: Message, command: CommandObject | None = None):
    code = command.args if command is not None else None

    if code:
        user_id = await telegram_link_service.resolve_link_code(code)

        if user_id is not None:
            async with AsyncSessionLocal() as db:
                await telegram_link_service.save_chat_id(user_id, str(message.chat.id), db)
                locale = await _get_locale(user_id, db)
                t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
                await message.answer(t['welcome_linked'], reply_markup=get_main_keyboard(locale))
            return

        await message.answer(BOT_TRANSLATIONS['ru']['invalid_code'])
        return

    # Check if already linked
    async with AsyncSessionLocal() as db:
        user_id = await telegram_link_service.get_user_id_by_chat_id(str(message.chat.id), db)
        if user_id:
            locale = await _get_locale(user_id, db)
            t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
            await message.answer(t['welcome'], reply_markup=get_main_keyboard(locale))
        else:
            await message.answer(BOT_TRANSLATIONS['ru']['welcome'])


# ─── STATS COMMAND / BUTTON ───
@router.message(Command('stats'))
@router.message(F.text.in_([BOT_TRANSLATIONS['en']['btn_stats'], BOT_TRANSLATIONS['ru']['btn_stats'], BOT_TRANSLATIONS['tg']['btn_stats']]))
async def handle_stats(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        stats = await crud_card.get_learning_stats(user_id, db)
        text = t['stats_msg'].format(
            total=stats['cards_total'],
            learned=stats['learned_count'],
            due=stats['due_today'],
            retention=stats['retention_rate']
        )
        await message.answer(text, parse_mode="Markdown")


# ─── STREAK COMMAND / BUTTON ───
@router.message(Command('streak'))
@router.message(F.text.in_([BOT_TRANSLATIONS['en']['btn_streak'], BOT_TRANSLATIONS['ru']['btn_streak'], BOT_TRANSLATIONS['tg']['btn_streak']]))
async def handle_streak(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        streak = await streaks.get_streak(user_id, db)
        text = t['streak_msg'].format(current=streak.current_streak, best=streak.best_streak)
        await message.answer(text, parse_mode="Markdown")


# ─── RANK COMMAND / BUTTON ───
@router.message(Command('rank'))
@router.message(F.text.in_([BOT_TRANSLATIONS['en']['btn_rank'], BOT_TRANSLATIONS['ru']['btn_rank'], BOT_TRANSLATIONS['tg']['btn_rank']]))
async def handle_rank(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

    rank_info = await ratings.get_my_rank(user_id, ratings.LEADERBOARD_GLOBAL_KEY)

    if rank_info['rank'] is None:
        # If not ranked, display default rank
        text = t['rank_msg'].format(rank='-', score=rank_info.get('score', 0))
    else:
        text = t['rank_msg'].format(rank=rank_info['rank'], score=rank_info['score'])

    await message.answer(text, parse_mode="Markdown")


# ─── LEVEL COMMAND ───
@router.message(Command('level'))
async def handle_level(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        result = await db.execute(
            select(UserLanguages).where(UserLanguages.user_id == user_id, UserLanguages.is_target.is_(True))
        )
        language = result.scalar_one_or_none()

        if language is None:
            await message.answer(t['no_target_lang'])
            return

        await message.answer(t['level_msg'].format(lang=language.language, level=language.level))


# ─── ACHIEVEMENTS COMMAND / BUTTON ───
@router.message(Command('achievements'))
@router.message(F.text.in_([BOT_TRANSLATIONS['en']['btn_achievements'], BOT_TRANSLATIONS['ru']['btn_achievements'], BOT_TRANSLATIONS['tg']['btn_achievements']]))
async def handle_achievements(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        # Query user achievements earned
        q = select(Achievements, UserAchievements).join(
            UserAchievements, UserAchievements.achievement_id == Achievements.id
        ).where(UserAchievements.user_id == user_id).order_by(UserAchievements.earned_at.desc())
        
        res = await db.execute(q)
        pairs = res.all()

        if not pairs:
            await message.answer(t['no_achievements'])
            return

        lines = [t['achievements_title']]
        for ach, ua in pairs:
            date_str = ua.earned_at.strftime('%d.%m.%Y')
            lines.append(t['achievement_item'].format(title=ach.title, desc=ach.description or '', date=date_str))

        await message.answer('\n'.join(lines), parse_mode="Markdown")


# ─── HELP COMMAND / BUTTON ───
@router.message(Command('help'))
@router.message(F.text.in_([BOT_TRANSLATIONS['en']['btn_help'], BOT_TRANSLATIONS['ru']['btn_help'], BOT_TRANSLATIONS['tg']['btn_help']]))
async def handle_help(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return
        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
        await message.answer(t['help'])


# ─── ENTER AI CHAT MODE ───
@router.message(Command('ai'))
@router.message(F.text.in_([BOT_TRANSLATIONS['en']['btn_ai'], BOT_TRANSLATIONS['ru']['btn_ai'], BOT_TRANSLATIONS['tg']['btn_ai']]))
async def handle_ai_init(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return
        
        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        # Set active chat mode flag in Redis
        await redis_client.set(f"user:tg:chat_mode:{message.chat.id}", "1", ex=1800) # 30 min session TTL
        await message.answer(t['ai_intro'], reply_markup=get_chat_keyboard(locale), parse_mode="Markdown")


# ─── EXIT CHAT MODE ───
@router.message(Command('exit'))
@router.message(F.text.in_([BOT_TRANSLATIONS['en']['btn_exit'], BOT_TRANSLATIONS['ru']['btn_exit'], BOT_TRANSLATIONS['tg']['btn_exit']]))
async def handle_ai_exit(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return
        
        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        # Clear active chat mode flag in Redis
        await redis_client.delete(f"user:tg:chat_mode:{message.chat.id}")
        await message.answer(t['ai_exit'], reply_markup=get_main_keyboard(locale))


# ─── GENERAL MESSAGE HANDLER (HANDLES LIVE CHAT OR REDIRECTS) ───
@router.message()
async def handle_all_messages(message: Message):
    # Check if user is in AI Chat Mode
    chat_mode = await redis_client.get(f"user:tg:chat_mode:{message.chat.id}")

    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        if chat_mode:
            text = message.text

            if not text:
                return

            try:
                await check_ai_access(user_id, db)
            except AppError as exc:
                await message.answer(exc.message)
                return

            result = await db.execute(
                select(UserLanguages).where(UserLanguages.user_id == user_id, UserLanguages.is_target.is_(True))
            )
            language = result.scalar_one_or_none()
            language_name = language.language if language is not None else 'English'
            level = language.level if language is not None else None

            session = await ai_chat.get_or_create_open_session(user_id, 'telegram', language_name, db, level=level)

            started = time.monotonic()
            
            # Send loading status message
            status_msg = await message.answer("⏳ ...")
            
            try:
                reply = await ai_chat.send_message(session.id, text, db)
                elapsed = max(1, round(time.monotonic() - started))

                await add_ai_seconds(user_id, elapsed)
                session.seconds_spent += elapsed
                await db.commit()

                # Edit status message to print AI answer
                await status_msg.edit_text(reply['assistant_message'].text)
            except Exception as e:
                await status_msg.edit_text(f"Error calling AI Tutor: {e}")
        else:
            # If not in chat mode, show the main welcome menu
            await message.answer(t['welcome'], reply_markup=get_main_keyboard(locale))
