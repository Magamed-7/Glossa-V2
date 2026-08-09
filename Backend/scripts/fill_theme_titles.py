# -*- coding: utf-8 -*-
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
import app.models.model_content  # noqa: F401 - registers grammar_lessons for FK resolution
from app.models.model_course import CourseUnit

# id: (en, ru, tg) — ru is authoritative for existing content; only overwritten where it
# was actually an English grammar-topic fallback mistakenly stored as the Russian title.
TITLES = {
1: ("Getting acquainted, greetings", "Знакомство, приветствие", "Шиносоӣ, салом додан"),
2: ("People and music of the world", "Люди и музыка мира", "Одамон ва мусиқии ҷаҳон"),
3: ("Rest and travel", "Отдых и путешествия", "Истироҳат ва сафар"),
4: ("City transport", "Городской транспорт", "Нақлиёти шаҳрӣ"),
5: ("Singular and plural nouns; a / an", "Единственное и множественное число существительных; a / an", "Исми танҳо ва ҷамъ; a / an"),
6: ("Souvenirs", "Сувениры", "Тӯҳфаҳои ёдгорӣ"),
7: ("Family", "Семья", "Оила"),
8: ("Adjectives", "Имена прилагательные", "Сифатҳо"),
9: ("Food and breakfast", "Еда и завтрак", "Хӯрок ва нонушта"),
10: ("A long flight", "Долгий перелёт", "Парвози тӯлонӣ"),
11: ("Work and professions", "Работа и профессии", "Кор ва касбҳо"),
12: ("Adverbs of frequency", "Наречия частотности", "Зарфҳои такрор"),
13: ("Word order in questions", "Порядок слов в вопросах", "Тартиби калимаҳо дар саволҳо"),
14: ("Cinema", "Кино", "Синамо"),
15: ("Parking and rules", "Парковка и правила", "Мошингузорӣ ва қоидаҳо"),
16: ("Hobbies and cooking", "Хобби и готовка", "Машғулиятҳо ва пухтупаз"),
17: ("Everything's fine! (on a trip)", "Всё в порядке! (в поездке)", "Ҳама чиз хуб аст! (дар сафар)"),
18: ("Working undercover", "Работа под прикрытием", "Кор дар зери ниқоб"),
19: ("A hotel with a view", "Отель с видом", "Меҳмонхона бо манзара"),
20: ("Where were you yesterday?", "Где ты был вчера?", "Дирӯз дар куҷо будӣ?"),
21: ("A new life in another country", "Новая жизнь в другой стране", "Ҳаёти нав дар кишвари дигар"),
22: ("How the day went", "Как прошёл день", "Рӯз чӣ тавр гузашт"),
23: ("Fellow travellers on the train", "Попутчики в поезде", "Ҳамсафарон дар поезд"),
24: ("Have got / Has got", "Have got / Has got", "Have got / Has got"),
25: ("One world, different countries", "Один мир, разные страны", "Як ҷаҳон, кишварҳои гуногун"),
26: ("First day in class", "Первый день в классе", "Рӯзи аввали дарс"),
27: ("Email and contacts", "Электронная почта и контакты", "Почтаи электронӣ ва тамосҳо"),
28: ("Singular and plural nouns", "Единственное и множественное число существительных", "Исми танҳо ва ҷамъ"),
29: ("Adjectives; modifiers very / really / quite", "Имена прилагательные; усилители very / really / quite", "Сифатҳо; калимаҳои таъкидӣ very / really / quite"),
30: ("Calm down!", "Спокойнее!", "Ором бош!"),
31: ("Time sequencers and connectors", "Слова-связки и последовательность времени", "Пайвасткунакҳо ва пайдарпаии вақт"),
32: ("Good and bad in the country", "Хорошее и плохое в стране", "Хубу баде дар кишвар"),
33: ("A 9-to-5 job", "Работа с 9 до 5", "Кор аз соати 9 то 5"),
34: ("Word order in questions; question words", "Порядок слов в вопросах; вопросительные слова", "Тартиби калимаҳо дар саволҳо; калимаҳои саволӣ"),
35: ("Family photos", "Семейные фото", "Аксҳои оилавӣ"),
36: ("Prepositions of time (at, in, on) and place (at, in, to)", "Предлоги времени (at, in, on) и места (at, in, to)", "Пешояндҳои вақт (at, in, on) ва ҷой (at, in, to)"),
37: ("Position of adverbs and expressions of frequency", "Место наречий и выражений частотности в предложении", "Ҷои зарфҳо ва ибораҳои такрор дар ҷумла"),
38: ("Elections and promises", "Выборы и обещания", "Интихобот ва ваъдаҳо"),
39: ("A quiet life?", "Тихая жизнь?", "Ҳаёти ором?"),
40: ("The city in any season", "Город в любое время года", "Шаҳр дар ҳар фасли сол"),
41: ("Quantifiers: too, not enough", "Квантификаторы: too, not enough", "Миқдорнишондиҳандаҳо: too, not enough"),
42: ("A North African story", "Североафриканская история", "Ҳикояи Африқои Шимолӣ"),
43: ("A special date", "Особенная дата", "Санаи махсус"),
44: ("Revision: be or do?", "Повторение: be или do?", "Такрор: be ё do?"),
45: ("Selfies and photos", "Селфи и фотографии", "Селфӣ ва аксҳо"),
46: ("Wrong name, wrong place", "Не то имя, не то место", "На он ном, на он ҷой"),
47: ("New Year", "Новый год", "Соли нав"),
48: ("Have to, don't have to, must, mustn't", "Have to, don't have to, must, mustn't", "Have to, don't have to, must, mustn't"),
49: ("A detective mystery", "Детективная загадка", "Муаммои детективӣ"),
50: ("Should", "Should", "Should"),
51: ("A house with history", "Дом с историей", "Хонаи бо таърих"),
52: ("Room 333", "Комната 333", "Ҳуҷраи 333"),
53: ("Dinner last night", "Ужин вчера вечером", "Хӯроки шоми дирӯз"),
54: ("White gold (sugar)", "Белое золото (сахар)", "Тиллои сафед (шакар)"),
55: ("Comparative adjectives", "Сравнительная степень прилагательных", "Дараҷаи қиёсии сифатҳо"),
56: ("Superlative adjectives", "Превосходная степень прилагательных", "Дараҷаи олии сифатҳо"),
57: ("Five continents in a day", "Пять континентов за день", "Панҷ қитъа дар як рӯз"),
58: ("The fortune teller", "Предсказатель", "Фолбин"),
59: ("Adverbs of manner and modifiers", "Наречия образа действия и усилители", "Зарфҳои тарзи амал ва калимаҳои таъкидӣ"),
60: ("Experiences or things?", "Впечатления или вещи?", "Таассурот ё чизҳо?"),
61: ("Definite article: the or no the", "Определённый артикль: the или без артикля", "Артикли муайянӣ: the ё бе артикл"),
62: ("I've seen it ten times!", "Я видел это десять раз!", "Ман инро даҳ бор дидаам!"),
63: ("He travelled the whole world", "Он объездил весь мир", "Ӯ тамоми ҷаҳонро гашт"),
64: ("Revision: question formation", "Повторение: образование вопросов", "Такрор: сохтани саволҳо"),
65: ("Word order in questions", "Порядок слов в вопросах", "Тартиби калимаҳо дар саволҳо"),
66: ("A perfect date?", "Идеальное свидание?", "Мулоқоти беҳтарин?"),
67: ("The 'Makeover' project", "Проект «Переделка»", "Лоиҳаи «Тағйирот»"),
68: ("Where's my passport?!", "Где мой паспорт?!", "Шиноснома ман дар куҷост?!"),
69: ("That's me in the photo!", "Это я на фото!", "Ин ман дар акс ҳастам!"),
70: ("Planning a trip", "Планирование путешествия", "Ба нақша гирифтани сафар"),
71: ("Mark it in the calendar", "Отметь в календаре", "Дар тақвим қайд кун"),
72: ("Word games", "Игры в слова", "Бозиҳои калимавӣ"),
73: ("Who does what around the house", "Кто что делает по дому", "Кӣ дар хона чӣ кор мекунад"),
74: ("In your basket", "В твоей корзине", "Дар сабади ту"),
75: ("A great weekend", "Отличные выходные", "Рӯзҳои истироҳати аъло"),
76: ("Comparative adjectives and adverbs; as...as", "Сравнительная степень прилагательных и наречий; as...as", "Дараҷаи қиёсии сифатҳо ва зарфҳо; as...as"),
77: ("Twelve lost wallets", "Двенадцать потерянных кошельков", "Дувоздаҳ ҳамьёни гумшуда"),
78: ("Think positive", "Мыслить позитивно", "Мусбат фикр кунед"),
79: ("I will always love you", "Я всегда буду любить тебя", "Ман ҳамеша туро дӯст медорам"),
80: ("Review of verb forms: present, past and future", "Повторение форм глагола: настоящее, прошедшее и будущее", "Такрори шаклҳои феъл: замони ҳозира, гузашта ва оянда"),
81: ("Uses of the infinitive with to", "Употребление инфинитива с to", "Истифодаи масдар бо to"),
82: ("Happiness is...", "Счастье — это...", "Бахт ин аст..."),
83: ("Murphy's Law", "Закон Мёрфи", "Қонуни Мёрфи"),
84: ("Possessive pronouns", "Притяжательные местоимения", "Ҷонишинҳои соҳибӣ"),
85: ("Beware of the dog", "Осторожно, злая собака", "Эҳтиёт бошед, саги хашмгин"),
86: ("What we're afraid of", "Чего мы боимся", "Аз чӣ мо метарсем"),
87: ("Scream queens", "Королевы крика", "Маликаҳои дод задан"),
88: ("Question tags", "Разделительные вопросы", "Саволҳои ҷудошаванда"),
89: ("Expressing movement (prepositions and verbs)", "Выражение движения (предлоги и глаголы)", "Ифодаи ҳаракат (пешояндҳо ва феълҳо)"),
90: ("Word order of phrasal verbs", "Порядок слов в фразовых глаголах", "Тартиби калимаҳо дар феълҳои таркибӣ"),
91: ("The passive", "Страдательный залог", "Сиғаи мафъул"),
92: ("Ask the teacher", "Спроси учителя", "Аз муаллим пурсед"),
93: ("Can't decide!", "Не могу решить!", "Наметавонам қарор кунам!"),
94: ("Incredible!", "Невероятно!", "Ғайриимкон!"),
95: ("Think before you speak", "Думай, прежде чем говорить", "Пеш аз гап задан фикр кун"),
96: ("Questions without auxiliaries", "Вопросы без вспомогательных глаголов", "Саволҳо бе феъли ёрирасон"),
97: ("Eating at home and out", "Еда дома и вне дома", "Хӯрок дар хона ва берун"),
98: ("Modern families", "Современные семьи", "Оилаҳои муосир"),
99: ("How we spend money", "Как мы тратим деньги", "Мо чӣ тавр пул сарф мекунем"),
100: ("Life changes", "Жизнь меняется", "Ҳаёт тағир меёбад"),
101: ("Choosing between the comparative and superlative", "Выбор между сравнительной и превосходной степенью", "Интихоб байни дараҷаи қиёсӣ ва олӣ"),
102: ("Articles: a/an, the, and zero article", "Артикли: a/an, the и нулевой артикль", "Артиклҳо: a/an, the ва бе артикл"),
103: ("Bad manners?", "Плохие манеры?", "Одоби бад?"),
104: ("Yes, I can!", "Да, я могу!", "Ҳа, ман метавонам!"),
105: ("Sports superstitions", "Спортивные суеверия", "Хурофоти варзишӣ"),
106: ("Unreal conditionals (mixed conditionals)", "Нереальные условные предложения (смешанный тип)", "Ҷумлаҳои шартии ғайривоқеӣ (навъи омехта)"),
107: ("How we met", "Как мы познакомились", "Мо чӣ тавр шинос шудем"),
108: ("Wish for present/future situations; wish for past regrets", "Wish для настоящего/будущего; wish для сожалений о прошлом", "Wish барои ҳозира/оянда; wish барои пушаймонӣ аз гузашта"),
109: ("The passive (all tenses)", "Страдательный залог (все времена)", "Сиғаи мафъул (ҳамаи замонҳо)"),
110: ("Every picture tells a story", "Каждая картина рассказывает историю", "Ҳар расм ҳикояеро нақл мекунад"),
111: ("Live and learn", "Век живи — век учись", "Умр ба сар бар, илм омӯз"),
112: ("Second conditional; choosing between the first and second conditional", "Второй тип условных предложений; выбор между первым и вторым типом", "Ҷумлаи шартии дуюм; интихоб байни намуди якум ва дуюм"),
113: ("Choosing between the gerund and the infinitive", "Выбор между герундием и инфинитивом", "Интихоб байни герундий ва масдар"),
114: ("Reported speech: statements and questions", "Косвенная речь: утверждения и вопросы", "Нутқи ғайримустақим: ҷумлаҳои хабарӣ ва саволӣ"),
115: ("The third conditional", "Третий тип условных предложений", "Ҷумлаи шартии сеюм"),
116: ("Quantifiers", "Квантификаторы", "Миқдорнишондиҳандаҳо"),
117: ("Relative clauses: defining and non-defining", "Определительные придаточные: ограничительные и описательные", "Ҷумлаҳои пайрави муайянкунанда: маҳдудкунанда ва тавсифӣ"),
118: ("Question formation, including indirect questions and questions to the subject", "Образование вопросов, включая косвенные вопросы и вопросы к подлежащему", "Сохтани саволҳо, аз ҷумла саволҳои ғайримустақим ва саволҳо ба мубтадо"),
119: ("Emphatic auxiliary verbs; the...the... with comparatives", "Эмфатические вспомогательные глаголы; конструкция the...the... со сравнительной степенью", "Феълҳои ёрирасони таъкидӣ; сохтори the...the... бо дараҷаи қиёсӣ"),
120: ("Doctor, doctor!", "Доктор, доктор!", "Духтур, духтур!"),
121: ("Adjectives used as nouns; order of adjectives", "Прилагательные в роли существительных; порядок прилагательных", "Сифатҳо дар нақши исм; тартиби сифатҳо"),
122: ("Fasten your seatbelts", "Пристегните ремни", "Тасмаҳоро бандед"),
123: ("Position of adverbs and adverbial phrases", "Место наречий и наречных оборотов в предложении", "Ҷои зарфҳо ва ибораҳои зарфӣ дар ҷумла"),
124: ("Stormy weather", "Штормовая погода", "Обу ҳавои тӯфонӣ"),
125: ("Zero and first conditionals; future time clauses", "Нулевой и первый тип условных предложений; придаточные времени будущего", "Ҷумлаи шартии сифр ва якум; ҷумлаҳои пайрави замони оянда"),
126: ("Good night", "Спокойной ночи", "Шаби хуш"),
127: ("Gerunds and infinitives (advanced patterns, including verb + object + infinitive)", "Герундий и инфинитив (сложные конструкции, включая глагол + дополнение + инфинитив)", "Герундий ва масдар (сохторҳои мураккаб, аз ҷумла феъл + пуркунанда + масдар)"),
128: ("Let's not argue", "Давай не будем спорить", "Биёед баҳс накунем"),
129: ("Verbs of the senses", "Глаголы чувственного восприятия", "Феълҳои эҳсосот"),
130: ("Reducing crime", "Снижая преступность", "Паст кардани ҷинояткорӣ"),
131: ("Fake news", "Фейковые новости", "Хабарҳои сохта"),
132: ("Clauses of concession and purpose", "Придаточные уступки и цели", "Ҷумлаҳои пайрави мулозимат ва мақсад"),
133: ("Uncountable and plural nouns", "Неисчисляемые и множественные существительные", "Исмҳои ношумурдани ва ҷамъ"),
134: ("Science and fiction", "Наука и фантастика", "Илм ва фантастика"),
135: ("Articles (advanced uses)", "Артикли (продвинутое употребление)", "Артиклҳо (истифодаи пешрафта)"),
136: ("So, neither + auxiliaries", "So, neither + вспомогательные глаголы", "So, neither + феълҳои ёрирасон"),
137: ("Nominalisation", "Номинализация", "Номиналиатсия"),
138: ("Participle clauses", "Причастные обороты", "Ибораҳои сифати феълӣ"),
139: ("Emphasis with cleft sentences", "Эмфаза в расщеплённых предложениях", "Таъкид дар ҷумлаҳои тақсимшуда"),
140: ("Complex inversion", "Сложная инверсия", "Инверсияи мураккаб"),
}


async def main():
    async with AsyncSessionLocal() as db:
        rows = (await db.execute(select(CourseUnit))).scalars().all()
        updated = 0
        for unit in rows:
            if unit.id not in TITLES:
                print(f'MISSING translation for unit {unit.id} ({unit.theme_title_ru!r})')
                continue
            en, ru, tg = TITLES[unit.id]
            unit.theme_title_en = en
            unit.theme_title_ru = ru
            unit.theme_title_tg = tg
            updated += 1
        await db.commit()
        print(f'updated {updated} / {len(rows)} units')


if __name__ == '__main__':
    asyncio.run(main())
