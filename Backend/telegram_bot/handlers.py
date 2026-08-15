import time
from datetime import datetime
from decimal import Decimal, InvalidOperation

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

from app.core.config import settings
from app.core.errors import AppError
from app.core.limits import add_ai_seconds, check_ai_access
from app.core.redis_client import redis_client
from app.db.database import AsyncSessionLocal
from app.models.model_profile import UserProfiles, UserLanguages
from app.models.model_achievement import UserAchievements, Achievements
from app.services import (
    ai_chat, crud_card, crud_payment, crud_subscription, dc_payment, ratings, streaks, telegram_link_service,
)

router = Router()

# ─── TRANSLATIONS FOR THREE LANGUAGES (EN/RU/TG) ───
BOT_TRANSLATIONS = {
    'en': {
        'welcome_linked': (
            "🎉 *Glossa Account Connected!* 🎉\n\n"
            "Excellent progress! Your Telegram account is now successfully linked to Glossa. 🚀 Welcome to your mobile companion.\n\n"
            "Here are your key actions:\n"
            "• 💬 Enter `/ai` to speak with your *AI Tutor* anytime, anywhere.\n"
            "• 📝 Enter `/stats` to view your vocabulary deck stats.\n"
            "• ⚙️ Enter `/settings` to configure your *SM-2 Spaced Repetition Reminders*.\n\n"
            "👉 For the complete list of tools and commands, type `/help` or click the button in the bottom menu."
        ),
        'invalid_code': 'This link is invalid or expired. Please generate a new one from your Glossa settings.',
        'welcome': (
            "🌟 *Welcome to Glossa Mobile!* 🌟\n\n"
            "Your pocket companion on the journey to ultimate language mastery. 🚀\n\n"
            "Here you can practice speaking with our *AI Tutor*, keep track of your *spaced repetition queue (SM-2)*, view your academic *achievements*, check your global leaderboard *rank*, and view real-time *vocabulary learning stats*!\n\n"
            "🔗 *To unlock all capabilities, please connect your Glossa account:*\n"
            "1️⃣ Go to the website.\n"
            "2️⃣ Open *Settings* ⚙️ -> *Notifications* 🔔.\n"
            "3️⃣ Click the *Link Telegram* button to link.\n\n"
            "📖 For a detailed list of commands and options, type /help or click the button below. Let's make learning natural!"
        ),
        'not_linked': 'Your account is not linked. Please visit Glossa settings on the website to link Telegram.',
        'no_target_lang': 'No target language set yet.',
        'level_msg': 'Your level in {lang}: {level}',
        'stats_msg': '📝 *Your Vocabulary Stats*:\n\n• Total Words: {total}\n• Learned: {learned}\n• Due today: {due}\n• Retention rate: {retention}%',
        'streak_msg': '🔥 *Current Streak*: {current} days\n🏆 *Best Streak*: {best} days',
        'rank_msg': '🏆 *Global Rank*: #{rank} with {score} XP',
        'ai_intro': '💬 *AI Tutor Chat Mode* is now active!\nSend any message directly, and I will reply as your AI Tutor. Type /exit or click the button below to return to the main menu.',
        'ai_exit': 'Left AI Chat. You are now back in the main menu.',
        'help': (
            "📖 *Glossa Command Directory & Help Guide* 📖\n\n"
            "Explore the full spectrum of Glossa Mobile commands:\n\n"
            "🤖 **Core Interface Commands**:\n"
            "• `/start` - Welcome screen & connection setup\n"
            "• `/help` - Displays this comprehensive command directory\n\n"
            "📈 **Vocabulary & Study Progress**:\n"
            "• `/stats` - Detailed statistics of your word deck (total, learned, due words)\n"
            "• `/streak` - Check active study days & historic record\n"
            "• `/rank` - View global standing & total academic XP\n"
            "• `/level` - Active target languages & CEFR proficiency levels\n"
            "• `/achievements` - Review all unlocked academic badges & milestones\n\n"
            "💬 **AI Language Practice**:\n"
            "• `/ai` - Launch immersive context chat with *AI Tutor*\n"
            "• `/exit` - Exit AI chat session and restore main menu\n\n"
            "⚙️ **Bot Control & Settings**:\n"
            "• `/language` - Change bot language interface (EN, RU, TG)\n"
            "• `/settings` - Toggle SM-2 spaced repetition daily notifications\n\n"
            "💡 *Pro-Tip*: Use the bot menu button in the bottom left corner to run these commands instantly at any time!"
        ),
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
        # Payments
        'balance_current': '💰 *Your balance*: {balance} TJS\n\nChoose an amount to top up:',
        'balance_custom_hint': 'Or send any custom amount as a number (e.g. 75.50).',
        'subscribe_catalog': '📦 *Available plans*:\n\nChoose one to pay for:',
        'invoice': (
            "💳 *Invoice #{order_id}*\n"
            "Purpose: {purpose}\n"
            "Amount to transfer: `{amount}` TJS (IMPORTANT: transfer the exact amount, including kopeks)\n\n"
            "Card number (Dushanbe City / Корти Милли):\n"
            "`{card_number}` (tap to copy)\n\n"
            "⏳ This invoice is valid for 30 minutes."
        ),
        'purpose_topup': 'Balance top-up',
        'purpose_subscription': 'Subscription payment',
        'btn_check_payment': '🔄 Check payment',
        'btn_cancel_order': '❌ Cancel order',
        'order_status_pending': '⏳ Not paid yet. Waiting for the transfer.',
        'order_status_paid': '✅ Paid! Order completed.',
        'order_status_expired': '⌛ This invoice expired. Start a new one with /balance or /subscribe.',
        'order_status_cancelled': '❌ Order cancelled.',
        'order_cancelled': '❌ Order #{order_id} cancelled.',
        'order_not_found': 'Order not found.',
        'invalid_amount': 'Please send a valid positive amount, e.g. 100 or 75.50.',
    },
    'ru': {
        'welcome_linked': (
            "🎉 *Аккаунт Glossa успешно подключен!* 🎉\n\n"
            "Отличный шаг! Ваш Telegram теперь привязан к платформе Glossa. 🚀 Добро пожаловать в мобильный командный пункт.\n\n"
            "Основные действия:\n"
            "• 💬 Напишите `/ai` для начала практики с *ИИ-Репетитором*.\n"
            "• 📝 Напишите `/stats` для просмотра статистики личного словаря.\n"
            "• ⚙️ Напишите `/settings` для настройки *интервальных напоминаний SM-2*.\n\n"
            "👉 Для просмотра подробной справки по всем командам напишите `/help` или нажмите кнопку меню слева снизу."
        ),
        'invalid_code': 'Эта ссылка недействительна или устарела. Создайте новую в настройках Glossa на сайте.',
        'welcome': (
            "🌟 *Добро пожаловать в Glossa Mobile!* 🌟\n\n"
            "Ваш верный карманный компаньон на пути к свободному владению языками. 🚀\n\n"
            "Здесь вы можете общаться с персональным *ИИ-Репетитором*, отслеживать интервальные повторения слов по системе *SM-2*, следить за своими академическими *наградами*, проверять *серию дней* и просматривать *статистику словаря*!\n\n"
            "🔗 *Для подключения всех возможностей свяжите аккаунты:*\n"
            "1️⃣ Зайдите на сайт Glossa.\n"
            "2️⃣ Перейдите в *Настройки* ⚙️ -> *Уведомления* 🔔.\n"
            "3️⃣ Нажмите *Привязать Telegram*.\n\n"
            "📖 Для ознакомления со всеми возможностями напишите /help или используйте кнопку меню ниже. Давайте сделаем обучение увлекательным!"
        ),
        'not_linked': 'Ваш аккаунт не подключен. Пожалуйста, зайдите в настройки на сайте Glossa и привяжите Telegram.',
        'no_target_lang': 'Целевой язык еще не выбран.',
        'level_msg': 'Ваш уровень в {lang}: {level}',
        'stats_msg': '📝 *Ваша статистика*:\n\n• Всего слов: {total}\n• Изучено: {learned}\n• К повторению сегодня: {due}\n• Коэффициент удержания: {retention}%',
        'streak_msg': '🔥 *Текущая серия*: {current} дн.\n🏆 *Лучшая серия*: {best} дн.',
        'rank_msg': '🏆 *Мировой рейтинг*: #{rank} с {score} XP',
        'ai_intro': '💬 *Режим общения с ИИ-Репетитором* активен!\nОтправьте любое сообщение, и я отвечу вам как ИИ-Репетитор. Введите /exit или нажмите кнопку ниже, чтобы выйти.',
        'ai_exit': 'Вы вышли из чата с ИИ. Вы вернулись в главное меню.',
        'help': (
            "📖 *Справочник команд и руководство Glossa* 📖\n\n"
            "Исследуйте полный спектр команд мобильного помощника Glossa:\n\n"
            "🤖 **Основные команды**:\n"
            "• `/start` - Приветствие и статус подключения аккаунта\n"
            "• `/help` - Показать это подробное руководство\n\n"
            "📈 **Словарь и прогресс обучения**:\n"
            "• `/stats` - Подробная статистика вашего словаря (всего слов, выучено, к повторению)\n"
            "• `/streak` - Серия дней непрерывной практики и личные рекорды\n"
            "• `/rank` - Текущая позиция в мировом рейтинге и общий XP\n"
            "• `/level` - Активный изучаемый язык и уровень по шкале CEFR\n"
            "• `/achievements` - Посмотреть список всех заработанных наград и значков\n\n"
            "💬 **Разговорная практика**:\n"
            "• `/ai` - Войти в интерактивный чат с *ИИ-Репетитором*\n"
            "• `/exit` - Выйти из режима чата с ИИ и вернуться в меню\n\n"
            "⚙️ **Настройки бота**:\n"
            "• `/language` - Изменить язык интерфейса бота (EN, RU, TG)\n"
            "• `/settings` - Управление напоминаниями интервального повторения SM-2\n\n"
            "💡 *Совет*: Используйте кнопку меню в левом нижнем углу экрана для быстрого вызова любой команды в любое время!"
        ),
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
        # Payments
        'balance_current': '💰 *Твой баланс*: {balance} TJS\n\nВыбери сумму пополнения:',
        'balance_custom_hint': 'Или отправь любую другую сумму числом (например, 75.50).',
        'subscribe_catalog': '📦 *Доступные тарифы*:\n\nВыбери, за что хочешь заплатить:',
        'invoice': (
            "💳 Счет на оплату #{order_id}\n"
            "Назначение: {purpose}\n"
            "Сумма к переводу: `{amount}` TJS (ВАЖНО: переведите точную сумму с копейками)\n\n"
            "Номер карты (Dushanbe City / Корти Милли):\n"
            "`{card_number}` (нажмите, чтобы скопировать)\n\n"
            "⏳ Счет действителен 30 минут."
        ),
        'purpose_topup': 'Пополнение баланса',
        'purpose_subscription': 'Оплата подписки',
        'btn_check_payment': '🔄 Проверить оплату',
        'btn_cancel_order': '❌ Отменить заказ',
        'order_status_pending': '⏳ Ещё не оплачено. Ждём перевод.',
        'order_status_paid': '✅ Оплачено! Заказ выполнен.',
        'order_status_expired': '⌛ Срок счёта истёк. Начни заново через /balance или /subscribe.',
        'order_status_cancelled': '❌ Заказ отменён.',
        'order_cancelled': '❌ Заказ #{order_id} отменён.',
        'order_not_found': 'Заказ не найден.',
        'invalid_amount': 'Отправь корректную положительную сумму, например 100 или 75.50.',
    },
    'tg': {
        'welcome_linked': (
            "🎉 *Ҳисоби Glossa пайваст шуд!* 🎉\n\n"
            "Қадами олӣ! Акнун ҳисоби Telegram-и шумо ба Glossa бомуваффақият пайваст гардид. 🚀 Ба маркази идоракунии мобилии худ хуш омадед.\n\n"
            "Амалҳои асосӣ:\n"
            "• 💬 Нависед `/ai` барои оғози сӯҳбат бо *ИИ-Репетитор*.\n"
            "• 📝 Нависед `/stats` барои дидани омори луғати шахсӣ.\n"
            "• ⚙️ Нависед `/settings` барои танзими *ёддоварӣ аз SM-2*.\n\n"
            "👉 Барои дидани омори муфассали тамоми фармонҳо, нависед `/help` ё тугмаи менюи поёнии чапро пахш намоед."
        ),
        'invalid_code': 'Ин пайванд нодуруст аст ё мӯҳлаташ гузаштааст. Пайванди навро аз танзимоти Glossa гиред.',
        'welcome': (
            "🌟 *Ба Glossa Mobile хуш омадед!* 🌟\n\n"
            "Ҳамсафари хурди шумо дар роҳи азхудкунии комили забонҳо. 🚀\n\n"
            "Дар ин ҷо шумо метавонед бо *ИИ-Репетитор* (муаллими сунъӣ) гуфтугӯ кунед, омори луғавии худро бубинед, силсилаи рӯзҳои фаъолият ва дараҷаи ҷойи худро дар рейтинги ҷаҳонӣ назорат кунед!\n\n"
            "🔗 *Барои фаъол кардани тамоми имкониятҳо, ҳисоби худро пайваст кунед:*\n"
            "1️⃣ Ба сомонаи Glossa ворид шавед.\n"
            "2️⃣ Ба бахши *Танзимот* ⚙️ -> *Огоҳиномаҳо* 🔔 гузаред.\n"
            "3️⃣ Тугмаи *Пайваст кардани Telegram*-ро пахш намоед.\n\n"
            "📖 Барои дидани рӯйхати муфассали фармонҳо фармони /help-ро фиристед ё тугмаи зерро пахш кунед."
        ),
        'not_linked': 'Ҳисоби шумо пайваст нест. Лутфан ба танзимоти сомонаи Glossa даромада, Telegram-ро пайваст кунед.',
        'no_target_lang': 'Забони омӯхташаванда ҳанӯз интихоб нашудааст.',
        'level_msg': 'Сатҳи шумо дар {lang}: {level}',
        'stats_msg': '📝 *Омори луғати шумо*:\n\n• Шумораи калимаҳо: {total}\n• Омӯхташуда: {learned}\n• Барои такрор имрӯз: {due}\n• Сатҳи нигоҳдорӣ: {retention}%',
        'streak_msg': '🔥 *Силсилаи ҷорӣ*: {current} рӯз\n🏆 *Силсилаи беҳтарин*: {best} рӯз',
        'rank_msg': '🏆 *Рейтинги ҷаҳонӣ*: #{rank} бо {score} XP',
        'ai_intro': '💬 *Реҷаи гуфтугӯ бо ИИ-Репетитор* фаъол шуд!\nҲар паёме фиристед, ман ҳамчун ИИ-Репетитор ҷавоб медиҳам. Барои баромадан /exit ё тугмаи зерро пахш кунед.',
        'ai_exit': 'Шумо аз чати ИИ баромадед. Бозгашт ба менюи асосӣ.',
        'help': (
            "📖 *Дастури фармонҳо ва кӯмаки Glossa* 📖\n\n"
            "Имкониятҳои ёвари мобилии Glossa-ро омӯзед:\n\n"
            "🤖 **Фармонҳои асосӣ**:\n"
            "• `/start` - Паёми истиқболӣ ва ҳолати пайвасти ҳисоб\n"
            "• `/help` - Нишон додани ин дастури муфассал\n\n"
            "📈 **Луғат ва пешрафти омӯзиш**:\n"
            "• `/stats` - Омори муфассали луғати шумо (ҳамагӣ, омӯхташуда, барои такрор)\n"
            "• `/streak` - Силсилаи рӯзҳо ва рекорди шахсӣ\n"
            "• `/rank` - Ҷойи ҷорӣ дар рейтинги ҷаҳонӣ ва холҳои умумӣ (XP)\n"
            "• `/level` - Забони омӯхташаванда ва сатҳи дониши он (CEFR)\n"
            "• `/achievements` - Рӯйхати дастовардҳо ва нишонҳо\n\n"
            "💬 **Машқи гуфтугӯ**:\n"
            "• `/ai` - Оғози чати интерактивӣ бо *ИИ-Репетитор*\n"
            "• `/exit` - Баромадан аз чати ИИ ва бозгашт ба меню\n\n"
            "⚙️ **Танзимоти бот**:\n"
            "• `/language` - Иваз кардани забони бот (EN, RU, TG)\n"
            "• `/settings` - Идоракунии ёддоварӣ аз такрори SM-2\n\n"
            "💡 *Маслиҳат*: Тугмаи менюи поёнии чапи экранро барои иҷрои зуди фармонҳо исполда баред!"
        ),
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
        # Payments
        'balance_current': '💰 *Балансатон*: {balance} TJS\n\nМаблағи пуркуниро интихоб кунед:',
        'balance_custom_hint': 'Ё маблағи дигарро ҳамчун рақам фиристед (масалан, 75.50).',
        'subscribe_catalog': '📦 *Тарифҳои дастрас*:\n\nБарои чӣ пардохт кардан мехоҳед интихоб кунед:',
        'invoice': (
            "💳 Ҳисоб барои пардохт #{order_id}\n"
            "Мақсад: {purpose}\n"
            "Маблағи интиқол: `{amount}` TJS (МУҲИМ: маблағи дақиқро бо тин интиқол диҳед)\n\n"
            "Рақами корт (Dushanbe City / Корти Миллӣ):\n"
            "`{card_number}` (барои нусхабардорӣ пахш кунед)\n\n"
            "⏳ Ҳисоб 30 дақиқа эътибор дорад."
        ),
        'purpose_topup': 'Пуркунии баланс',
        'purpose_subscription': 'Пардохти тариф',
        'btn_check_payment': '🔄 Санҷиши пардохт',
        'btn_cancel_order': '❌ Бекор кардани фармоиш',
        'order_status_pending': '⏳ Ҳанӯз пардохт нашудааст. Мунтазири интиқол ҳастем.',
        'order_status_paid': '✅ Пардохт шуд! Фармоиш иҷро гардид.',
        'order_status_expired': '⌛ Мӯҳлати ҳисоб гузашт. Аз нав тавассути /balance ё /subscribe оғоз кунед.',
        'order_status_cancelled': '❌ Фармоиш бекор карда шуд.',
        'order_cancelled': '❌ Фармоиши #{order_id} бекор карда шуд.',
        'order_not_found': 'Фармоиш ёфт нашуд.',
        'invalid_amount': 'Маблағи дурусти мусбатро фиристед, масалан 100 ё 75.50.',
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
                await message.answer(t['welcome_linked'], reply_markup=get_main_keyboard(locale), parse_mode="Markdown")
            return

        await message.answer(BOT_TRANSLATIONS['ru']['invalid_code'])
        return

    # Check if already linked
    async with AsyncSessionLocal() as db:
        user_id = await telegram_link_service.get_user_id_by_chat_id(str(message.chat.id), db)
        if user_id:
            locale = await _get_locale(user_id, db)
            t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
            await message.answer(t['welcome'], reply_markup=get_main_keyboard(locale), parse_mode="Markdown")
        else:
            await message.answer(BOT_TRANSLATIONS['ru']['welcome'], parse_mode="Markdown")


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
        await message.answer(t['help'], parse_mode="Markdown")


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


# ─── PAYMENTS: BALANCE TOP-UP ───
TOPUP_PRESETS = [50, 100, 200, 500]


def get_topup_keyboard() -> InlineKeyboardMarkup:
    kb = [
        [InlineKeyboardButton(text=f"{amount} TJS", callback_data=f"topup:{amount}") for amount in TOPUP_PRESETS[:2]],
        [InlineKeyboardButton(text=f"{amount} TJS", callback_data=f"topup:{amount}") for amount in TOPUP_PRESETS[2:]],
    ]
    return InlineKeyboardMarkup(inline_keyboard=kb)


def get_invoice_keyboard(order_id: int, locale: str) -> InlineKeyboardMarkup:
    t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
    kb = [
        [InlineKeyboardButton(text=t['btn_check_payment'], callback_data=f"check_order:{order_id}")],
        [InlineKeyboardButton(text=t['btn_cancel_order'], callback_data=f"cancel_order:{order_id}")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=kb)


async def _send_invoice(message: Message, order, locale: str):
    t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])
    purpose = t['purpose_topup'] if order.intent == 'top_up' else t['purpose_subscription']
    text = t['invoice'].format(
        order_id=order.id, purpose=purpose, amount=order.expected_amount, card_number=settings.DC_CARD_NUMBER,
    )
    await message.answer(text, reply_markup=get_invoice_keyboard(order.id, locale), parse_mode="Markdown")


@router.message(Command('balance'))
async def handle_balance_cmd(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        balance = await crud_payment.get_or_create_balance(user_id, db)
        await message.answer(
            t['balance_current'].format(balance=balance.balance), reply_markup=get_topup_keyboard(), parse_mode="Markdown"
        )
        await message.answer(t['balance_custom_hint'])
        await redis_client.set(f"user:tg:awaiting_topup:{message.chat.id}", "1", ex=300)


@router.callback_query(F.data.startswith('topup:'))
async def handle_topup_preset(callback: CallbackQuery):
    amount = Decimal(callback.data.split(':')[1])

    async with AsyncSessionLocal() as db:
        user_id = await telegram_link_service.get_user_id_by_chat_id(str(callback.message.chat.id), db)
        if user_id is None:
            await callback.answer("Account not linked.")
            return

        locale = await _get_locale(user_id, db)
        order = await dc_payment.create_order(user_id, 'top_up', amount, db)
        await redis_client.delete(f"user:tg:awaiting_topup:{callback.message.chat.id}")

    await _send_invoice(callback.message, order, locale)
    await callback.answer()


# ─── PAYMENTS: SUBSCRIPTION CATALOG ───
def get_subscribe_keyboard(plans, locale: str) -> InlineKeyboardMarkup:
    kb = []
    for plan in plans:
        if plan.code == 'free':
            continue
        kb.append([
            InlineKeyboardButton(
                text=f"{plan.code.title()} — 1mo — {plan.price_monthly} TJS", callback_data=f"sub:{plan.code}:monthly"
            ),
            InlineKeyboardButton(
                text=f"{plan.code.title()} — 1yr — {plan.price_yearly} TJS", callback_data=f"sub:{plan.code}:yearly"
            ),
        ])
    return InlineKeyboardMarkup(inline_keyboard=kb)


@router.message(Command('subscribe'))
async def handle_subscribe_cmd(message: Message):
    async with AsyncSessionLocal() as db:
        user_id = await _get_linked_user_id(message, db)
        if user_id is None:
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        plans = await crud_subscription.get_plans(db)
        await message.answer(t['subscribe_catalog'], reply_markup=get_subscribe_keyboard(plans, locale), parse_mode="Markdown")


@router.callback_query(F.data.startswith('sub:'))
async def handle_subscribe_pick(callback: CallbackQuery):
    _, plan_code, period = callback.data.split(':')

    async with AsyncSessionLocal() as db:
        user_id = await telegram_link_service.get_user_id_by_chat_id(str(callback.message.chat.id), db)
        if user_id is None:
            await callback.answer("Account not linked.")
            return

        locale = await _get_locale(user_id, db)
        plan = await crud_subscription.get_plan_by_code(plan_code, db)
        if plan is None:
            await callback.answer("Plan not found.")
            return

        base_amount = plan.price_monthly if period == 'monthly' else plan.price_yearly
        order = await dc_payment.create_order(user_id, 'subscription', base_amount, db, plan_code=plan_code, period=period)

    await _send_invoice(callback.message, order, locale)
    await callback.answer()


# ─── PAYMENTS: CHECK / CANCEL ORDER ───
@router.callback_query(F.data.startswith('check_order:'))
async def handle_check_order(callback: CallbackQuery):
    order_id = int(callback.data.split(':')[1])

    async with AsyncSessionLocal() as db:
        user_id = await telegram_link_service.get_user_id_by_chat_id(str(callback.message.chat.id), db)
        if user_id is None:
            await callback.answer("Account not linked.")
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        try:
            order = await dc_payment.get_order(order_id, user_id, db)
        except AppError:
            await callback.answer(t['order_not_found'])
            return

    status_key = f"order_status_{order.status}"
    await callback.answer(t.get(status_key, order.status), show_alert=True)


@router.callback_query(F.data.startswith('cancel_order:'))
async def handle_cancel_order(callback: CallbackQuery):
    order_id = int(callback.data.split(':')[1])

    async with AsyncSessionLocal() as db:
        user_id = await telegram_link_service.get_user_id_by_chat_id(str(callback.message.chat.id), db)
        if user_id is None:
            await callback.answer("Account not linked.")
            return

        locale = await _get_locale(user_id, db)
        t = BOT_TRANSLATIONS.get(locale, BOT_TRANSLATIONS['en'])

        try:
            await dc_payment.cancel_order(order_id, user_id, db)
        except AppError as exc:
            await callback.answer(exc.message)
            return

    await callback.message.edit_reply_markup(reply_markup=None)
    await callback.message.answer(t['order_cancelled'].format(order_id=order_id))
    await callback.answer()


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

        awaiting_topup = await redis_client.get(f"user:tg:awaiting_topup:{message.chat.id}")
        if awaiting_topup:
            await redis_client.delete(f"user:tg:awaiting_topup:{message.chat.id}")
            try:
                amount = Decimal((message.text or '').strip().replace(',', '.'))
                if amount <= 0:
                    raise InvalidOperation
            except InvalidOperation:
                await message.answer(t['invalid_amount'])
                return

            order = await dc_payment.create_order(user_id, 'top_up', amount, db)
            await _send_invoice(message, order, locale)
            return

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
            await message.answer(t['welcome'], reply_markup=get_main_keyboard(locale), parse_mode="Markdown")
