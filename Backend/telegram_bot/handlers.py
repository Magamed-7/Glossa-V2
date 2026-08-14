import time
from datetime import datetime

from aiogram import Router, F
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import (
    Message,
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    CallbackQuery,
)
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
        'help': 'Available commands:\n• /stats - Vocabulary stats\n• /streak - Active learning days\n• /rank - Leaderboard rank\n• /level - Language level\n• /ai - Converse with AI\n• /achievements - View earned badges\n• /language - Change bot language\n• /settings - Toggle SM-2 reminders\n• /exit - Exit chat mode',
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
        # New Settings & Language translations
        'language_select': 'Select bot language / Выберите язык бота / Забони ботро интихоб кунед:',
        'language_changed': 'Bot language changed to English! 🇬🇧',
        'settings_title': '⚙️ *Telegram Settings*:',
        'btn_sm2_notifications': 'SM-2 Reminders',
        'enabled': 'Enabled ✅',
        'disabled': 'Disabled ❌',
        'settings_updated': 'Settings updated successfully.',
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
        'help': 'Доступные команды:\n• /stats - Статистика словаря\n• /streak - Серия дней занятий\n• /rank - Место в рейтинге\n• /level - Уровень языка\n• /ai - Общение с ИИ\n• /achievements - Ваши награды\n• /language - Сменить язык бота\n• /settings - Настройка напоминаний SM-2\n• /exit - Выйти из чата',
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
        # New Settings & Language translations
        'language_select': 'Select bot language / Выберите язык бота / Забони ботро интихоб кунед:',
        'language_changed': 'Язык бота изменен на русский! 🇷🇺',
        'settings_title': '⚙️ *Настройки Telegram*:',
        'btn_sm2_notifications': 'Напоминания SM-2',
        'enabled': 'Включены ✅',
        'disabled': 'Выключены ❌',
        'settings_updated': 'Настройки успешно обновлены.',
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
        'help': 'Фармонҳои дастрас:\n• /stats - Омори луғат\n• /streak - Силсилаи рӯзҳо\n• /rank - Ҷойи шумо дар рейтинг\n• /level - Сатҳи забон\n• /ai - Чат бо ИИ\n• /achievements - Дастовардҳо\n• /language - Иваз кардани забони бот\n• /settings - Танзимоти ёддоварӣ аз SM-2\n• /exit - Баромадан аз чат',
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
        # New Settings & Language translations
        'language_select': 'Select bot language / Выберите язык бота / Забони ботро интихоб кунед:',
        'language_changed': 'Забони бот ба тоҷикӣ иваз карда шуд! 🇹🇯',
        'settings_title': '⚙️ *Танзимоти Telegram*:',
        'btn_sm2_notifications': 'Ёддоварӣ аз SM-2',
        'enabled': 'Фаъол ✅',
        'disabled': 'Ғайрифаъол ❌',
        'settings_updated': 'Танзимот бо муваффақият нав карда шуд.',
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


def get_language_inline_keyboard() -> InlineKeyboardMarkup:
    kb = [
        [
            InlineKeyboardButton(text="English", callback_data="set_lang_en"),
            InlineKeyboardButton(text="Русский", callback_data="set_lang_ru"),
            InlineKeyboardButton(text="Тоҷикӣ", callback_data="set_lang_tg")
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=kb)


def get_settings_inline_keyboard(locale: str, sm2_enabled: bool) -> InlineKeyboardMarkup:
    t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
    status_text = t['enabled'] if sm2_enabled else t['disabled']
    kb = [
        [
            InlineKeyboardButton(
                text=f"{t['btn_sm2_notifications']}: {status_text}",
                callback_data="toggle_sm2"
            )
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=kb)


# ─── DYNAMIC LOCALE RETRIEVAL ───
async def _get_locale(user_id: int, db) -> str:
    from app.services import crud_settings
    try:
        settings = await crud_settings.get_settings(user_id, db)
        loc = settings.telegram_language
        if not loc:
            loc = settings.interface_language
            settings.telegram_language = loc
            await db.commit()
        return loc if loc in ('en', 'ru', 'tg') else 'en'
    except Exception:
        return 'en'


async def _get_linked_user_id(message: Message, db):
    user_id = await telegram_link_service.get_user_id_by_chat_id(str(message.chat.id), db)
    if user_id is None:
        # Default to Russian for default warning if not linked
        await message.answer(BOT_TRANSLATIONS['ru']['not_linked'])
    return user_id


# ─── ACHIEVEMENT LOCALIZATION HELPER ───
def translate_achievement(code: str, title: str, description: str | None, locale: str) -> tuple[str, str]:
    if locale == 'en':
        return title, description or ''

    threshold = 0
    try:
        threshold = int(code.split('_')[-1])
    except ValueError:
        pass

    if locale == 'ru':
        special_titles = {
            'words_10': "Первые 10 слов",
            'words_50': "50 изученных слов",
            'words_100': "100 изученных слов",
            'words_500': "500 изученных слов",
            'streak_7': "Неделя ударного режима",
            'streak_30': "Месяц ударного режима",
            'streak_100': "100 дней ударного режима",
            'friends_5': "5 друзей",
            'friends_20': "20 друзей",
            'reviews_5': "5 выполненных повторений",
            'stories_written_1': "Первая история",
            'stories_written_5': "5 написанных историй",
            'stories_written_20': "20 написанных историй",
            'stories_sold_1': "Первая продажа",
            'stories_sold_10': "10 продаж",
            'reviews_received_10': "10 полученных отзывов",
        }
        special_descs = {
            'words_10': "Выучите свои первые 10 слов в личной колоде.",
            'words_50': "Выучите 50 слов в своей личной колоде.",
            'words_100': "Выучите 100 слов в своей личной колоде.",
            'words_500': "Выучите 500 слов в своей личной колоде.",
            'streak_7': "Поддерживайте ударный режим активного обучения в течение 7 дней.",
            'streak_30': "Поддерживайте ударный режим активного обучения в течение 30 дней.",
            'streak_100': "Поддерживайте ударный режим активного обучения в течение 100 дней.",
            'friends_5': "Подключитесь к 5 друзьям в сообществе.",
            'friends_20': "Подключитесь к 20 друзьям в сообществе.",
            'reviews_5': "Выполните 5 повторений словарных карточек.",
            'stories_written_1': "Напишите и опубликуйте свою первую историю в библиотеке.",
            'stories_written_5': "Напишите и опубликуйте 5 историй в библиотеке.",
            'stories_written_20': "Напишите и опубликуйте 20 историй в библиотеке.",
            'stories_sold_1': "Продайте свою опубликованную историю первому учащемуся.",
            'stories_sold_10': "Продайте свои опубликованные истории 10 учащимся.",
            'reviews_received_10': "Получите 10 отзывов на свои опубликованные истории.",
        }
        if code in special_titles:
            return special_titles[code], special_descs.get(code, description or '')

        if code.startswith('words_'):
            return f"Словарный запас: Уровень {threshold}", f"Изучите в общей сложности {threshold} слов в своей личной колоде."
        if code.startswith('streak_'):
            return f"Ударный режим: {threshold} дн.", f"Поддерживайте ударный режим активного обучения в течение {threshold} дней."
        if code.startswith('friends_'):
            return f"Общительность: Уровень {threshold}", f"Подключитесь к {threshold} друзьям в сообществе."
        if code.startswith('reviews_received_'):
            return f"Популярный автор: Уровень {threshold}", f"Получите {threshold} отзывов на свои опубликованные истории."
        if code.startswith('reviews_'):
            return f"Интервальное повторение: Уровень {threshold}", f"Выполните {threshold} повторений словарных карточек."
        if code.startswith('stories_written_'):
            return f"Автор: Уровень {threshold}", f"Напишите и опубликуйте {threshold} историй в библиотеке."
        if code.startswith('stories_sold_'):
            return f"Издатель: Уровень {threshold}", f"Продайте свои опубликованные истории {threshold} учащимся."

    elif locale == 'tg':
        special_titles_tg = {
            'words_10': "10 вожаи аввал",
            'words_50': "50 вожаи омӯхташуда",
            'words_100': "100 вожаи омӯхташуда",
            'words_500': "500 вожаи омӯхташуда",
            'streak_7': "Як ҳафтаи пайвастагӣ",
            'streak_30': "Як моҳи пайвастагӣ",
            'streak_100': "100 рӯзи пайвастагӣ",
            'friends_5': "5 дӯст",
            'friends_20': "20 дӯст",
            'reviews_5': "5 такрори иҷрошуда",
            'stories_written_1': "Ҳикояи аввалин",
            'stories_written_5': "5 ҳикояи навишташуда",
            'stories_written_20': "20 ҳикояи навишташуда",
            'stories_sold_1': "Фурӯши аввалин",
            'stories_sold_10': "10 фурӯш",
            'reviews_received_10': "10 тақризи гирифташуда",
        }
        special_descs_tg = {
            'words_10': "10 вожаи аввалини худро дар дастаи шахсӣ омӯзед.",
            'words_50': "50 вожаро дар дастаи шахсии उत्सुक омӯзед.",
            'words_100': "100 вожаро дар дастаи шахсии худ омӯзед.",
            'words_500': "500 вожаро дар дастаи шахсии худ омӯзед.",
            'streak_7': "Пайвастагии омӯзиши фаъолро барои 7 рӯз нигоҳ доред.",
            'streak_30': "Пайвастагии омӯзиши фаъолро барои 30 рӯз нигоҳ доред.",
            'streak_100': "Пайвастагии омӯзиши фаъолро барои 100 рӯз нигоҳ доред.",
            'friends_5': "Бо 5 дӯст дар ҷомеа пайваст шавед.",
            'friends_20': "Бо 20 дӯст дар ҷомеа пайваст шавед.",
            'reviews_5': "5 такрори кортҳои луғавиро иҷро кунед.",
            'stories_written_1': "Ҳикояи аввалини худро дар китобхона нависед ва нашр кунед.",
            'stories_written_5': "5 ҳикояро дар китобхона нависед ва нашр кунед.",
            'stories_written_20': "20 ҳикояро дар китобхона нависед ва нашр кунед.",
            'stories_sold_1': "Ҳикояи нашршудаи худро ба омӯзандаи аввалин фурӯшед.",
            'stories_sold_10': "Ҳикояҳои нашршудаи худро ба 10 омӯзанда фурӯшед.",
            'reviews_received_10': "10 тақриз ба ҳикояҳои нашршудаи худ гиред.",
        }
        if code in special_titles_tg:
            return special_titles_tg[code], special_descs_tg.get(code, description or '')

        if code.startswith('words_'):
            return f"Сатҳи захираи луғавӣ: {threshold}", f"Ҳамагӣ {threshold} вожаро дар дастаи шахсии худ омӯзед."
        if code.startswith('streak_'):
            return f"Пайвастагӣ: {threshold} рӯз", f"Пайвастагии омӯзиши фаъолро барои {threshold} рӯз нигоҳ доред."
        if code.startswith('friends_'):
            return f"Сатҳи муошират: {threshold}", f"Бо {threshold} дӯст дар ҷомеа пайваст шавед."
        if code.startswith('reviews_received_'):
            return f"Муаллифи машҳур: Сатҳи {threshold}", f"{threshold} тақриз ба ҳикояҳои нашршудаи худ гиред."
        if code.startswith('reviews_'):
            return f"Сатҳи такрори фосилавӣ: {threshold}", f"{threshold} такрори кортҳои луғавиро иҷро кунед."
        if code.startswith('stories_written_'):
            return f"Муаллиф: Сатҳи {threshold}", f"{threshold} ҳикояро дар китобхона нависед ва нашр кунед."
        if code.startswith('stories_sold_'):
            return f"Ношир: Сатҳи {threshold}", f"Ҳикояҳои нашршудаи худро ба {threshold} омӯзанда фурӯшед."

    return title, description or ''


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
            loc_title, loc_desc = translate_achievement(ach.code, ach.title, ach.description, locale)
            lines.append(t['achievement_item'].format(title=loc_title, desc=loc_desc, date=date_str))

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


# ─── LANGUAGE COMMAND ───
@router.message(Command('language'))
async def handle_language_cmd(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return
        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
        await message.answer(t['language_select'], reply_markup=get_language_inline_keyboard())


@router.callback_query(F.data.startswith('set_lang_'))
async def handle_set_language(callback: CallbackQuery):
    lang_code = callback.data.split('_')[-1]
    if lang_code not in ('en', 'ru', 'tg'):
        return

    async with AsyncSessionLocal() as db:
        user_id = await telegram_link_service.get_user_id_by_chat_id(str(callback.message.chat.id), db)
        if user_id is None:
            await callback.answer("Account not linked.")
            return

        from app.services import crud_settings
        settings = await crud_settings.get_settings(user_id, db)
        settings.telegram_language = lang_code
        await db.commit()

        t = BOT_TRANSLATIONS[lang_code]
        await callback.message.answer(t['language_changed'], reply_markup=get_main_keyboard(lang_code))
        await callback.answer()
        try:
            await callback.message.delete()
        except Exception:
            pass


# ─── SETTINGS COMMAND ───
@router.message(Command('settings'))
async def handle_settings_cmd(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return
        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        from app.services import crud_settings
        settings = await crud_settings.get_settings(user_id, db)

        await message.answer(
            t['settings_title'],
            reply_markup=get_settings_inline_keyboard(locale, settings.telegram_sm2_enabled),
            parse_mode="Markdown"
        )


@router.callback_query(F.data == 'toggle_sm2')
async def handle_toggle_sm2(callback: CallbackQuery):
    async with AsyncSessionLocal() as db:
        user_id = await telegram_link_service.get_user_id_by_chat_id(str(callback.message.chat.id), db)
        if user_id is None:
            await callback.answer("Account not linked.")
            return

        from app.services import crud_settings
        settings = await crud_settings.get_settings(user_id, db)
        settings.telegram_sm2_enabled = not settings.telegram_sm2_enabled
        await db.commit()

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        await callback.message.edit_reply_markup(
            reply_markup=get_settings_inline_keyboard(locale, settings.telegram_sm2_enabled)
        )
        await callback.answer(t['settings_updated'])


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

                reply_text = reply['assistant_message'].text
                if not reply_text or not reply_text.strip():
                    reply_text = "..."

                corrections = reply['user_message'].corrections
                if corrections:
                    corr_lines = []
                    if locale == 'ru':
                        corr_lines.append("\n\n*Исправления:*")
                        for c in corrections:
                            corr_lines.append(f"\n• Вместо «{c.get('what')}» лучше сказать: *{c.get('better')}*\n  _{c.get('why')}_")
                    elif locale == 'tg':
                        corr_lines.append("\n\n*Ислоҳот:*")
                        for c in corrections:
                            corr_lines.append(f"\n• Ба ҷои «{c.get('what')}» беҳтар аст гӯед: *{c.get('better')}*\n  _{c.get('why')}_")
                    else:
                        corr_lines.append("\n\n*Corrections:*")
                        for c in corrections:
                            corr_lines.append(f"\n• Instead of \"{c.get('what')}\" it is better to say: *{c.get('better')}*\n  _{c.get('why')}_")
                    reply_text += "".join(corr_lines)

                # Edit status message to print AI answer
                await status_msg.edit_text(reply_text, parse_mode="Markdown")
            except Exception as e:
                await status_msg.edit_text(f"Error calling AI Tutor: {e}")
        else:
            # If not in chat mode, show the main welcome menu
            await message.answer(t['welcome'], reply_markup=get_main_keyboard(locale))
