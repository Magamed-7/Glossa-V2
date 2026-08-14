"""
Comprehensive seed script that enriches existing leaderboard users with:
- diverse subscriptions (free / premium / pro)
- user languages at various levels
- user stories (books) with prices for the marketplace
- lingo services
- social graph (follows)
- streaks & achievements
- privacy settings (some fields hidden for some users)
- wallet balances
- vocabulary cards
"""
import asyncio
import random
import sys
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select, text, func
from app.db.database import AsyncSessionLocal
from app.models.model_user import Users
from app.models.model_profile import ProfilePrivacy, UserLanguages, UserProfiles
from app.models.model_achievement import Achievements, UserAchievements, UserStreaks
from app.models.model_card import Cards
from app.models.model_social import Follows
from app.models.model_subscription import Plans, UserSubscriptions
from app.models.model_user_story import UserStories, StoryReviews
from app.models.model_lingo import LingoServices

# ── Rich user stories to seed as "books" ─────────────────────────────────────
BOOK_DATA = [
    {
        "title": "Утро на крыше",
        "description": "Сарвиноз каждое утро поднимается на крышу, чтобы увидеть город до того, как он проснётся.",
        "body": (
            "Каждое утро, когда солнце ещё не поднялось, Сарвиноз тихо выходит из квартиры. "
            "Она поднимается по узкой лестнице на крышу пятиэтажного дома. Город внизу спит. "
            "Только птицы уже поют.\n\n"
            "На крыше стоит старый стул. Сарвиноз садится и смотрит на горы. Горы розовые от первого света. "
            "Она думает о бабушке, которая жила в деревне и тоже вставала рано.\n\n"
            "«Утро — это подарок», говорила бабушка. Сарвиноз улыбается. Через час город зашумит, "
            "но сейчас он принадлежит только ей."
        ),
        "cefr_level": "A1", "genre": "slice of life", "price": None,
    },
    {
        "title": "The Wrong Suitcase",
        "description": "At the airport, two travelers accidentally swap identical suitcases — and discover something unexpected inside.",
        "body": (
            "Flight 472 from Istanbul had just landed. Kamol grabbed a black suitcase from the carousel "
            "and walked straight to his taxi. He was tired and did not check the tag.\n\n"
            "At home, he opened the suitcase. Inside: a wedding dress, three jars of honey, and a letter "
            "addressed to someone named Gulnora. It was not his.\n\n"
            "His phone rang. A woman's voice, anxious: 'Hello? I think I have your suitcase. It is full of "
            "English textbooks and a stuffed bear named Professor.' Kamol laughed. He had been carrying that "
            "bear since university.\n\n"
            "They agreed to meet at a café near the airport. When Gulnora arrived, she was laughing too. "
            "'Your bear is very well-read,' she said, setting the suitcase on the table. They exchanged bags "
            "and, somehow, phone numbers."
        ),
        "cefr_level": "A2", "genre": "comedy", "price": None,
    },
    {
        "title": "Чойхонаи кӯҳна",
        "description": "Дар чойхонаи кӯҳна дар канори дарё, ду одами ношинос сӯҳбат мекунанд ва дӯст мешаванд.",
        "body": (
            "Дар канори дарёи Вахш як чойхонаи кӯҳна ҳаст. Деворҳояш аз гил, бомаш аз чӯб. "
            "Ин ҷо одамон чой менӯшанд ва оромӣ пайдо мекунанд.\n\n"
            "Як рӯзи гарм, Фирӯз ба ин чойхона омад. Вай мехост танҳо бошад. "
            "Аммо дар кунҷи чойхона як пирамард нишаста буд. Пирамард табассум кард.\n\n"
            "«Чой танҳо нӯшидан гуноҳ аст», гуфт пирамард. Фирӯз хандид ва назди вай нишаст. "
            "Онҳо то шом сӯҳбат карданд — дар бораи кӯҳҳо, дар бораи зиндагӣ, дар бораи орзуҳо. "
            "Фирӯз фаҳмид, ки баъзан беҳтарин дӯстон инҳоянд, ки онҳоро интизор набудӣ."
        ),
        "cefr_level": "B1", "genre": "drama", "price": Decimal("20.00"),
    },
    {
        "title": "Код вместо слов",
        "description": "Программист из Душанбе получает загадочные pull-реквесты от незнакомца, который пишет в комментариях стихи.",
        "body": (
            "Шахзод работал удалённо на стартап из Берлина. Каждое утро — код, каждый вечер — код. "
            "Он почти не разговаривал с людьми. Но однажды кто-то создал pull-request в его репозиторий. "
            "Код был идеальным, но в комментариях — стихотворение на фарси.\n\n"
            "Шахзод принял PR. На следующий день — ещё один. И снова стихи. "
            "Через неделю он понял: незнакомец исправляет баги, которые Шахзод сам не замечал, "
            "а стихи — это его способ общения.\n\n"
            "Шахзод написал в ответ свой первый комментарий не на языке программирования, "
            "а на человеческом: «Кто ты?» Ответ пришёл через минуту: «Я тот, кто читает твой код "
            "как поэзию. А ты читай мои стихи как инструкцию.»\n\n"
            "Они так и не встретились лично, но их совместный проект стал лучшим open-source "
            "инструментом для изучения таджикского языка."
        ),
        "cefr_level": "B2", "genre": "drama", "price": Decimal("45.00"),
    },
    {
        "title": "The Translator's Dilemma",
        "description": "A literary translator must decide whether to stay faithful to the original or to the truth the author tried to hide.",
        "body": (
            "Madina had translated seventeen novels, each one a bridge between Tajik and English. "
            "She had never questioned an author's intent — until the manuscript of 'The Silver Orchard' "
            "arrived on her desk.\n\n"
            "The novel was beautiful, a pastoral elegy for a village that no longer existed. But Madina "
            "recognized the village. She had been there. And the version in the book was not the truth. "
            "The author had erased the dam, the displacement, the families who left with nothing. "
            "In his version, the village simply faded, like a watercolor left in the rain.\n\n"
            "She sat with two drafts: one that honored the prose, and one that restored the missing "
            "chapter. The publisher wanted the first. Her conscience demanded the second. "
            "In the end, she submitted both — and let the reader decide which story deserved to survive."
        ),
        "cefr_level": "C1", "genre": "drama", "price": Decimal("75.00"),
    },
    {
        "title": "Пешпоёк дар борон",
        "description": "Як духтараки хурдсол дар борон бозӣ мекунад ва ба ҳама дунё дарс медиҳад.",
        "body": (
            "Борон бо шиддат меборид. Ҳама одамон давида рафтанд. Аммо як духтараки хурд — "
            "Нилуфар — дар пиёдагард истод ва оҳиста-оҳиста рақс кард.\n\n"
            "Як мард зери чатр истода гуфт: «Ту тар мешавӣ!» Нилуфар хандид: «Борон ҳам мехоҳад "
            "бо касе бозӣ кунад.»\n\n"
            "Модараш аз тиреза нигоҳ мекард. Вай медонист, ки Нилуфар рост мегӯяд. Борон танҳост. "
            "Ва мо ҳам баъзан танҳоем."
        ),
        "cefr_level": "A1", "genre": "slice of life", "price": None,
    },
    {
        "title": "Рецепт бабушки",
        "description": "Внук пытается повторить плов бабушки по памяти — и понимает, что главный ингредиент нельзя купить.",
        "body": (
            "Тимур стоял на кухне и смотрел на казан. Он знал все ингредиенты: рис, морковь, мясо, "
            "зира, барбарис. Но плов получался не таким, как у бабушки.\n\n"
            "Он звонил маме. Мама говорила: «Добавь больше моркови.» Он звонил тёте. "
            "Тётя говорила: «Мясо должно быть курдючное.» Он даже написал в чат семейной группы. "
            "Дядя ответил голосовым на пять минут.\n\n"
            "Но плов всё равно был не тот. Тимур сел за стол и попробовал ещё раз. И вдруг понял: "
            "бабушка не следовала рецепту. Она пела, пока готовила. Она разговаривала с рисом. "
            "Она клала любовь — не фигурально, а буквально: она всегда добавляла щепотку шафрана "
            "«для цвета счастья».\n\n"
            "Тимур достал шафран из шкафа. И запел."
        ),
        "cefr_level": "B1", "genre": "slice of life", "price": Decimal("25.00"),
    },
    {
        "title": "Midnight at the Library",
        "description": "A security guard discovers that the oldest books in the university library rearrange themselves at night.",
        "body": (
            "Rustam had been the night guard at the National Library for eleven years. He knew every creak "
            "in the floor, every draft from the windows, every shadow that the emergency lights cast on "
            "the marble walls. Nothing surprised him — until the Tuesday he found Aristotle's 'Poetics' "
            "shelved next to a 1987 Tajik phrasebook.\n\n"
            "He put it back. The next morning, it had moved again, this time next to a cookbook. "
            "Over the following weeks, more books shifted: a Persian poetry collection migrated to the "
            "science section; a calculus textbook appeared in children's literature.\n\n"
            "Rustam set up a camera. The footage showed nothing — no one entered after midnight. "
            "But every morning, the books had new neighbors. He began reading the pairs: Rumi next to "
            "quantum physics, Dostoevsky beside a gardening manual.\n\n"
            "And somehow, each pairing made a strange, beautiful sense, as if the books were having "
            "conversations he was only beginning to overhear."
        ),
        "cefr_level": "B2", "genre": "mystery", "price": Decimal("40.00"),
    },
    {
        "title": "Таксист-философ",
        "description": "Таксист из Худжанда даёт пассажирам не только маршруты, но и жизненные советы.",
        "body": (
            "Азиз возил людей уже двадцать лет. Его жёлтая «Опель Астра» знала каждую улицу Худжанда. "
            "Но пассажиры ценили его не за знание дорог.\n\n"
            "«Куда едем?» — спрашивал Азиз. «На работу», — отвечал пассажир. "
            "«А зачем на работу?» — «Деньги зарабатывать.» "
            "«А зачем деньги?» — И тут начинался настоящий разговор.\n\n"
            "Азиз никогда не давал советов. Он просто задавал вопросы. К концу поездки пассажиры "
            "сами находили ответы, которые искали месяцами. Студентка решила сменить факультет. "
            "Бизнесмен позвонил сыну впервые за три года. Бабушка записалась на курсы английского.\n\n"
            "«Я не философ, — говорил Азиз, — я просто таксист, который слушает. "
            "А дорога — она сама подсказывает.»"
        ),
        "cefr_level": "B1", "genre": "comedy", "price": Decimal("15.00"),
    },
    {
        "title": "Ранги осмон",
        "description": "Як рассоми ҷавон мехоҳад ранги осмони Душанберо дар тасвир кашад, аммо ҳеҷ ранг мувофиқ нест.",
        "body": (
            "Зарина рассом буд. Вай ранги ҳар чизро медонист: барг — сабз, офтоб — зард, об — кабуд. "
            "Аммо осмони Душанбе дигар буд. Вай на кабуд буд, на сафед.\n\n"
            "Зарина дар бом нишаста рангҳоро омехт. Кабуд бо сафед — не. "
            "Кабуд бо зард — не. Кабуд бо сурх — не.\n\n"
            "Як рӯз ба вай як писарбачаи хурд гуфт: «Осмон ранг надорад. "
            "Вай оинаи замин аст.» Зарина ба замин нигоҳ кард: кӯҳҳои хокистарӣ, "
            "дарахтони сабз, бомҳои сафед.\n\n"
            "Вай фаҳмид. Осмон — ин ҳама рангҳо якҷоя. Ва тасвири вай ниҳоят тайёр шуд."
        ),
        "cefr_level": "A2", "genre": "slice of life", "price": None,
    },
]

# ── Lingo services to add ────────────────────────────────────────────────────
SERVICE_DATA = [
    {
        "title": "Репетитор английского для IELTS",
        "title_en": "English Tutor for IELTS",
        "title_ru": "Репетитор английского для IELTS",
        "title_tg": "Омӯзгори англисӣ барои IELTS",
        "description": "Подготовка к IELTS Speaking и Writing. Band 7+ гарантирован за 3 месяца.",
        "description_en": "IELTS Speaking & Writing prep. Band 7+ guaranteed in 3 months.",
        "description_ru": "Подготовка к IELTS Speaking и Writing. Band 7+ гарантирован за 3 месяца.",
        "description_tg": "Тайёрӣ ба IELTS Speaking ва Writing. Band 7+ дар 3 моҳ кафолат дода мешавад.",
        "category": "ENGLISH", "cefr_level": "B2", "price": Decimal("120.00"),
        "currency": "TJS", "pricing_type": "hr",
    },
    {
        "title": "Conversational English Practice",
        "title_en": "Conversational English Practice",
        "title_ru": "Разговорный английский",
        "title_tg": "Инглисии муоширатӣ",
        "description": "Casual conversation sessions to build fluency and confidence.",
        "description_en": "Casual conversation sessions to build fluency and confidence.",
        "description_ru": "Разговорные сессии для развития беглости и уверенности.",
        "description_tg": "Ҷаласаҳои муоширатӣ барои инкишофи равонӣ ва боварӣ.",
        "category": "ENGLISH", "cefr_level": "B1", "price": Decimal("80.00"),
        "currency": "TJS", "pricing_type": "hr",
    },
    {
        "title": "Русский для начинающих",
        "title_en": "Russian for Beginners",
        "title_ru": "Русский для начинающих",
        "title_tg": "Русӣ барои навомӯзон",
        "description": "Основы русского языка: алфавит, базовая грамматика, первые диалоги.",
        "description_en": "Russian basics: alphabet, grammar foundations, first dialogues.",
        "description_ru": "Основы русского языка: алфавит, базовая грамматика, первые диалоги.",
        "description_tg": "Асосҳои забони русӣ: алифбо, грамматикаи асосӣ, гуфтугӯҳои аввалин.",
        "category": "RUSSIAN", "cefr_level": "A1", "price": Decimal("60.00"),
        "currency": "TJS", "pricing_type": "hr",
    },
    {
        "title": "Тарҷумаи расмӣ",
        "title_en": "Official Document Translation",
        "title_ru": "Перевод официальных документов",
        "title_tg": "Тарҷумаи ҳуҷҷатҳои расмӣ",
        "description": "Перевод паспортов, дипломов, справок. Русский ↔ Таджикский ↔ Английский.",
        "description_en": "Passports, diplomas, certificates. Russian ↔ Tajik ↔ English.",
        "description_ru": "Перевод паспортов, дипломов, справок. Русский ↔ Таджикский ↔ Английский.",
        "description_tg": "Тарҷумаи шиноснома, диплом, маълумотнома. Русӣ ↔ Тоҷикӣ ↔ Англисӣ.",
        "category": "TRANSLATION", "cefr_level": None, "price": Decimal("200.00"),
        "currency": "TJS", "pricing_type": "doc",
    },
    {
        "title": "Таджикский язык B2–C1",
        "title_en": "Tajik Language B2–C1",
        "title_ru": "Таджикский язык B2–C1",
        "title_tg": "Забони тоҷикӣ B2–C1",
        "description": "Продвинутый курс: деловой таджикский, литературный стиль, подготовка к экзаменам.",
        "description_en": "Advanced course: business Tajik, literary style, exam preparation.",
        "description_ru": "Продвинутый курс: деловой таджикский, литературный стиль, подготовка к экзаменам.",
        "description_tg": "Курси пешрафта: тоҷикии тиҷоратӣ, услуби адабӣ, тайёрӣ ба имтиҳонот.",
        "category": "TAJIK", "cefr_level": "B2", "price": Decimal("90.00"),
        "currency": "TJS", "pricing_type": "hr",
    },
    {
        "title": "Корректура и редактура текстов",
        "title_en": "Text Proofreading & Editing",
        "title_ru": "Корректура и редактура текстов",
        "title_tg": "Ислоҳ ва таҳрири матнҳо",
        "description": "Проверка грамматики, стиля и орфографии на русском и английском.",
        "description_en": "Grammar, style and spelling check in Russian and English.",
        "description_ru": "Проверка грамматики, стиля и орфографии на русском и английском.",
        "description_tg": "Санҷиши грамматика, услуб ва имло дар русӣ ва англисӣ.",
        "category": "EDITING", "cefr_level": None, "price": Decimal("0.05"),
        "currency": "TJS", "pricing_type": "word",
    },
]

# ── Vocab cards to seed for some users ────────────────────────────────────────
VOCAB_PAIRS = [
    ("apple", "яблоко", "I eat an apple every day."),
    ("book", "книга", "She is reading a good book."),
    ("water", "вода", "Please give me a glass of water."),
    ("friend", "друг", "He is my best friend."),
    ("language", "язык", "Learning a new language is exciting."),
    ("morning", "утро", "Good morning! How are you?"),
    ("city", "город", "This city is very beautiful."),
    ("mountain", "гора", "The mountains are covered with snow."),
    ("teacher", "учитель", "My teacher is very kind."),
    ("travel", "путешествие", "I love to travel around the world."),
    ("happy", "счастливый", "She looks very happy today."),
    ("garden", "сад", "There are roses in the garden."),
    ("music", "музыка", "I listen to music every evening."),
    ("family", "семья", "Family is the most important thing."),
    ("story", "история", "Tell me an interesting story."),
    ("window", "окно", "Open the window please."),
    ("bridge", "мост", "There is a bridge over the river."),
    ("dream", "мечта", "Never stop chasing your dreams."),
    ("library", "библиотека", "The library has many old books."),
    ("smile", "улыбка", "Your smile makes the world brighter."),
]

# Interest pools
INTEREST_POOLS = [
    ["чтение", "кулинария", "путешествия"],
    ["программирование", "шахматы", "музыка"],
    ["спорт", "фотография", "кино"],
    ["рисование", "поэзия", "йога"],
    ["садоводство", "иностранные языки", "танцы"],
    ["история", "астрономия", "настольные игры"],
    ["бег", "волонтёрство", "дизайн"],
]


async def seed():
    async with AsyncSessionLocal() as db:
        # ── 1. Get all existing seed users ────────────────────────────────
        result = await db.execute(
            text("SELECT id, username, first_name, last_name FROM users WHERE email LIKE '%@example.com' ORDER BY id")
        )
        users = result.fetchall()
        if not users:
            print("No seed users found. Run seed_leaderboard_users.py first.")
            return

        print(f"Found {len(users)} seed users to enrich.")

        # ── 2. Get plan IDs ──────────────────────────────────────────────
        plans_result = await db.execute(select(Plans))
        plans = {p.code: p.id for p in plans_result.scalars().all()}
        if not plans:
            print("No plans found. Run seed_plans.py first.")
            return
        print(f"Plans: {plans}")

        # ── 3. Get achievement IDs ───────────────────────────────────────
        ach_result = await db.execute(select(Achievements.id))
        all_achievement_ids = [row[0] for row in ach_result.all()]
        print(f"Found {len(all_achievement_ids)} achievements.")

        # ── 4. Enrich each user ──────────────────────────────────────────
        for idx, (user_id, username, first_name, last_name) in enumerate(users):
            rng = random.Random(user_id * 42)  # deterministic per user

            # ── 4a. Languages ─────────────────────────────────────────────
            existing_langs = (await db.execute(
                text("SELECT id FROM user_languages WHERE user_id = :uid"), {"uid": user_id}
            )).fetchone()

            if not existing_langs:
                lang_sets = [
                    [("Russian", "Native", False), ("English", rng.choice(["A1","A2","B1","B2","C1"]), True)],
                    [("Tajik", "Native", False), ("English", rng.choice(["A1","A2","B1"]), True)],
                    [("Tajik", "Native", False), ("Russian", rng.choice(["B1","B2","C1"]), True), ("English", rng.choice(["A1","A2"]), True)],
                    [("English", "Native", False), ("Russian", rng.choice(["A1","A2","B1","B2"]), True)],
                    [("Russian", "Native", False), ("Tajik", rng.choice(["A2","B1","B2"]), True), ("English", rng.choice(["B1","B2"]), True)],
                ]
                chosen = rng.choice(lang_sets)
                for lang, level, is_target in chosen:
                    db.add(UserLanguages(user_id=user_id, language=lang, level=level, is_target=is_target))

            # ── 4b. Streaks ───────────────────────────────────────────────
            streak_exists = (await db.execute(
                text("SELECT id FROM user_streaks WHERE user_id = :uid"), {"uid": user_id}
            )).fetchone()

            if not streak_exists:
                best = rng.randint(3, 120)
                current = rng.randint(0, min(best, 30))
                last_act = date.today() - timedelta(days=rng.randint(0, 7))
                db.add(UserStreaks(user_id=user_id, current_streak=current, best_streak=best, last_activity_date=last_act))

            # ── 4c. Achievements ──────────────────────────────────────────
            ach_exists = (await db.execute(
                text("SELECT id FROM user_achievements WHERE user_id = :uid LIMIT 1"), {"uid": user_id}
            )).fetchone()

            if not ach_exists and all_achievement_ids:
                num_achievements = rng.randint(2, min(15, len(all_achievement_ids)))
                chosen_ids = rng.sample(all_achievement_ids, num_achievements)
                for ach_id in chosen_ids:
                    db.add(UserAchievements(user_id=user_id, achievement_id=ach_id))

            # ── 4d. Subscriptions ─────────────────────────────────────────
            sub_exists = (await db.execute(
                text("SELECT id FROM user_subscriptions WHERE user_id = :uid AND is_active = true"), {"uid": user_id}
            )).fetchone()

            if not sub_exists:
                # ~20% pro, ~30% premium, ~50% free (no subscription row)
                roll = rng.random()
                if roll < 0.20:
                    plan_code = "pro"
                elif roll < 0.50:
                    plan_code = "premium"
                else:
                    plan_code = None

                if plan_code:
                    period = rng.choice(["monthly", "yearly"])
                    started = datetime.now(timezone.utc) - timedelta(days=rng.randint(10, 200))
                    if period == "monthly":
                        expires = started + timedelta(days=30)
                    else:
                        expires = started + timedelta(days=365)
                    # Ensure not expired yet for most
                    if expires < datetime.now(timezone.utc):
                        expires = datetime.now(timezone.utc) + timedelta(days=rng.randint(30, 300))

                    db.add(UserSubscriptions(
                        user_id=user_id, plan_id=plans[plan_code],
                        period=period, started_at=started, expires_at=expires, is_active=True,
                    ))

            # ── 4e. Wallet balance ────────────────────────────────────────
            balance = rng.choice([0, 0, 0, 50, 100, 200, 500, 750, 1000, 1500])
            if balance > 0:
                await db.execute(
                    text("UPDATE user_balances SET balance = :bal WHERE user_id = :uid"),
                    {"bal": balance, "uid": user_id},
                )

            # ── 4f. Privacy (randomize for ~30% of users) ─────────────────
            if rng.random() < 0.30:
                await db.execute(
                    text("""
                        UPDATE profile_privacy SET
                            show_achievements = :sa,
                            show_best_streak = :sbs,
                            show_current_streak = :scs,
                            show_languages = :sl,
                            show_followers = :sf,
                            show_services = :ss,
                            show_books = :sb,
                            show_subscription = :ssub
                        WHERE user_id = :uid
                    """),
                    {
                        "sa": rng.choice([True, False]),
                        "sbs": rng.choice([True, False]),
                        "scs": rng.choice([True, True, False]),
                        "sl": rng.choice([True, True, False]),
                        "sf": rng.choice([True, False]),
                        "ss": rng.choice([True, True, False]),
                        "sb": rng.choice([True, True, False]),
                        "ssub": rng.choice([True, False]),
                        "uid": user_id,
                    }
                )

            # ── 4g. Interests & bio update ────────────────────────────────
            interests = rng.choice(INTEREST_POOLS)
            bio_options = [
                f"Привет! Я {first_name}, изучаю языки на Glossa 📚",
                f"Hello! I'm {first_name}, passionate about languages and culture.",
                f"Салом! Ман {first_name}, забонҳои нав омӯхтанро дӯст медорам 🌍",
                f"{first_name} — учусь, читаю, путешествую. Рад(а) знакомству!",
                f"Language learner from Tajikistan 🇹🇯 | {first_name}",
                f"Люблю хороший плов и хорошую грамматику. {first_name}.",
                f"Филолог в душе, программист на работе. {first_name}.",
            ]
            bio = rng.choice(bio_options)
            await db.execute(
                text("UPDATE user_profiles SET bio = :bio, interests = :interests WHERE user_id = :uid"),
                {"bio": bio, "interests": str(interests).replace("'", '"'), "uid": user_id},
            )

            # ── 4h. Vocab cards for ~40% of users ────────────────────────
            cards_exist = (await db.execute(
                text("SELECT id FROM cards WHERE user_id = :uid LIMIT 1"), {"uid": user_id}
            )).fetchone()

            if not cards_exist and rng.random() < 0.40:
                num_cards = rng.randint(5, 20)
                chosen_vocab = rng.sample(VOCAB_PAIRS, min(num_cards, len(VOCAB_PAIRS)))
                for word, translation, example in chosen_vocab:
                    status = rng.choice(["learning", "learning", "learned"])
                    db.add(Cards(
                        user_id=user_id, word=word, translation=translation,
                        example=example, status=status,
                    ))

            await db.commit()
            print(f"  [{idx+1}/{len(users)}] Enriched {username} (id={user_id})")

        # ── 5. Seed user stories (books) ──────────────────────────────────
        print("\nSeeding user stories (books)...")
        existing_titles = set()
        titles_result = await db.execute(select(UserStories.title))
        for row in titles_result.all():
            existing_titles.add(row[0])

        # Pick authors from the pool of users
        author_pool = [u for u in users if len(u) == 4]  # (id, username, first, last)
        books_created = 0
        for i, book in enumerate(BOOK_DATA):
            if book["title"] in existing_titles:
                continue
            # Deterministic author assignment
            author = author_pool[i % len(author_pool)]
            story = UserStories(
                author_id=author[0],
                title=book["title"],
                body=book["body"],
                description=book["description"],
                cefr_level=book["cefr_level"],
                genre=book["genre"],
                price=book["price"],
                status="published",
                views_count=random.randint(5, 200),
            )
            db.add(story)
            await db.commit()
            await db.refresh(story)
            books_created += 1

            # Add reviews from other users
            reviewer_pool = [u for u in users if u[0] != author[0]]
            num_reviews = min(random.randint(1, 5), len(reviewer_pool))
            reviewers = random.sample(reviewer_pool, num_reviews)
            review_texts = [
                "Отличная история, легко читается!", "Great story, very engaging!",
                "Хикояи ҷолиб!", "Прочитал(а) на одном дыхании.", "Loved the plot twist!",
                "Рекомендую всем начинающим.", "Красивый слог, спасибо автору.",
                "Perfect for my level.", "Интересный сюжет!", "Very well written.",
            ]
            for reviewer in reviewers:
                existing_review = (await db.execute(
                    text("SELECT id FROM story_reviews WHERE story_id = :sid AND user_id = :uid"),
                    {"sid": story.id, "uid": reviewer[0]}
                )).fetchone()
                if not existing_review:
                    db.add(StoryReviews(
                        story_id=story.id, user_id=reviewer[0],
                        rating=random.randint(3, 5),
                        text=random.choice(review_texts),
                    ))
            await db.commit()

        print(f"Created {books_created} new books with reviews.")

        # ── 6. Seed lingo services ────────────────────────────────────────
        print("\nSeeding lingo services...")
        services_created = 0
        for i, svc in enumerate(SERVICE_DATA):
            # Check if service with same title exists
            existing_svc = (await db.execute(
                text("SELECT id FROM lingo_services WHERE title = :title"),
                {"title": svc["title"]}
            )).fetchone()
            if existing_svc:
                continue

            provider = author_pool[(i * 7 + 3) % len(author_pool)]
            db.add(LingoServices(
                provider_id=provider[0],
                title=svc["title"],
                description=svc["description"],
                title_en=svc["title_en"],
                title_ru=svc["title_ru"],
                title_tg=svc["title_tg"],
                description_en=svc["description_en"],
                description_ru=svc["description_ru"],
                description_tg=svc["description_tg"],
                category=svc["category"],
                cefr_level=svc["cefr_level"],
                price=svc["price"],
                currency=svc["currency"],
                pricing_type=svc["pricing_type"],
                status="active",
                rating=Decimal(str(round(random.uniform(4.2, 5.0), 2))),
                reviews_count=random.randint(3, 25),
            ))
            services_created += 1

        await db.commit()
        print(f"Created {services_created} new lingo services.")

        # ── 7. Seed social graph (follows) ────────────────────────────────
        print("\nSeeding social graph...")
        follows_created = 0
        for user_id, username, _, _ in users:
            existing_follows = (await db.execute(
                text("SELECT COUNT(*) FROM follows WHERE follower_id = :uid"), {"uid": user_id}
            )).scalar()

            if existing_follows > 0:
                continue

            rng = random.Random(user_id * 13)
            num_follows = rng.randint(2, 12)
            candidates = [u[0] for u in users if u[0] != user_id]
            targets = rng.sample(candidates, min(num_follows, len(candidates)))

            for target_id in targets:
                try:
                    db.add(Follows(follower_id=user_id, following_id=target_id))
                    follows_created += 1
                except Exception:
                    pass

        await db.commit()
        print(f"Created {follows_created} follow relationships.")

        print("\n[SUCCESS] Comprehensive seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
