import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.database import AsyncSessionLocal
from app.models.model_content import StoryQuestions

Q = {
    23: [
        ("What is Anna's job?", 'Кем работает Анна?', 'Анна бо кадом касб кор мекунад?',
         ['Nurse', 'Teacher', 'Doctor'], 'Nurse',
         'The story says my sister is a nurse and her name is Anna.', 'В истории сказано, что сестра — медсестра, и её зовут Анна.', 'Дар ҳикоя гуфта мешавад, ки хоҳар ҳамшираи тиббӣ аст ва номаш Анна.'),
        ('What colour car does Anna buy?', 'Машину какого цвета покупает Анна?', 'Анна мошини кадом ранг мехарад?',
         ['Red', 'Blue', 'Black'], 'Red',
         "Anna prefers the red car and buys it.", 'Анна предпочитает красную машину и покупает её.', 'Анна мошини сурхро авло медонад ва онро мехарад.'),
        ("What is the family dog's name?", 'Как зовут собаку семьи?', 'Номи саги оила чист?',
         ['Max', 'Rex', 'Zero'], 'Max',
         "The story says 'We have a dog. Its name is Max.'", 'В истории сказано: «У нас есть собака. Её зовут Макс».', 'Дар ҳикоя гуфта мешавад: «Мо саг дорем. Номи он Макс аст».'),
    ],
    24: [
        ("What is the babysitter's name?", 'Как зовут няню?', 'Номи парасторбача чист?',
         ['Sarah', 'Anna', 'Susan'], 'Sarah',
         'The babysitter is named Sarah.', 'Няню зовут Сара.', 'Номи парасторбача Сара аст.'),
        ('What food do they order?', 'Какую еду они заказывают?', 'Онҳо кадом хӯрокро фармоиш медиҳанд?',
         ['Pizza', 'Pasta', 'Sandwiches'], 'Pizza',
         "Sarah says 'Let's order pizza.'", 'Сара говорит: «Давайте закажем пиццу».', 'Сара мегӯяд: «Биёед питса фармоиш диҳем».'),
        ('What do the parents say about the children?', 'Что говорят родители о детях?', 'Волидон дар бораи фарзандон чӣ мегӯянд?',
         ['They were perfect', 'They were loud', 'They were tired'], 'They were perfect',
         "Sarah tells the parents 'They were perfect!'", 'Сара говорит родителям: «Они были идеальны!»', 'Сара ба волидон мегӯяд: «Онҳо беҳтарин буданд!»'),
    ],
    25: [
        ('What colour car does the father buy?', 'Машину какого цвета покупает отец?', 'Падар мошини кадом ранг мехарад?',
         ['Red', 'Blue', 'White'], 'Red',
         'He prefers the red car over the electric one.', 'Он предпочитает красную машину, а не электрическую.', 'Ӯ мошини сурхро аз электрикӣ авло медонад.'),
        ('What kind of car does he decide against?', 'От какой машины он отказывается?', 'Ӯ аз кадом мошин даст мекашад?',
         ['The electric car', 'The red car', 'The old car'], 'The electric car',
         'He thinks the electric car is ugly and prefers the red one.', 'Он считает электрическую машину некрасивой и предпочитает красную.', 'Ӯ мошини электрикиро зишт медонад ва сурхро авло медонад.'),
        ('Who is the new car for?', 'Для кого новая машина?', 'Мошини нав барои кист?',
         ['The whole family', 'Only the father', 'The mother'], 'The whole family',
         "The father says 'it's for us!'", 'Отец говорит: «она для нас!»', 'Падар мегӯяд: «он барои моҳамагист!»'),
    ],
    26: [
        ("What is the uncle's job?", 'Кем работает дядя?', 'Тағо бо кадом касб кор мекунад?',
         ['Musician', 'Doctor', 'Policeman'], 'Musician',
         'The story says my uncle is famous, he is a musician.', 'В истории сказано, что дядя знаменит, он музыкант.', 'Дар ҳикоя гуфта мешавад, ки тағо машҳур аст, ӯ мусиқинавоз аст.'),
        ("What is the uncle's girlfriend called?", 'Как зовут девушку дяди?', 'Номи дугонаи тағо чист?',
         ['Maria', 'Anna', 'Susan'], 'Maria',
         "Her name is Maria.", 'Её зовут Мария.', 'Номи вай Мария аст.'),
        ("What car does the uncle's friend have?", 'Какая машина у друга дяди?', 'Дӯсти тағо кадом мошинро дорад?',
         ['A Ferrari', 'An electric car', 'A blue car'], 'A Ferrari',
         'The uncle says the sports car is a Ferrari.', 'Дядя говорит, что спортивная машина — Феррари.', 'Тағо мегӯяд, ки мошини варзишӣ Феррари аст.'),
    ],
    27: [
        ('How old is the brother?', 'Сколько лет брату?', 'Бародар чандсола аст?',
         ['17', '12', '19'], '17',
         'The story says the brother is 17.', 'В истории сказано, что брату 17 лет.', 'Дар ҳикоя гуфта мешавад, ки бародар 17-сола аст.'),
        ("What is the uncle's job?", 'Кем работает дядя?', 'Тағо бо кадом касб кор мекунад?',
         ['Policeman', 'Doctor', 'Teacher'], 'Policeman',
         'The uncle is a policeman.', 'Дядя — полицейский.', 'Тағо полис аст.'),
        ("What is the family dog's name?", 'Как зовут собаку семьи?', 'Номи саги оила чист?',
         ['Rex', 'Max', 'Zero'], 'Rex',
         "The story says 'I have a dog. Its name is Rex.'", 'В истории сказано: «У меня есть собака. Её зовут Рекс».', 'Дар ҳикоя гуфта мешавад: «Ман саг дорам. Номи он Рекс аст».'),
    ],
    28: [
        ('What does Sarah drink for breakfast?', 'Что Сара пьёт на завтрак?', 'Сара барои наҳорӣ чӣ менӯшад?',
         ['Only coffee', 'Tea', 'Orange juice'], 'Only coffee',
         "Sarah doesn't like breakfast, she only drinks coffee.", 'Сара не любит завтрак, она пьёт только кофе.', 'Сара наҳориро дӯст намедорад, ӯ танҳо қаҳва менӯшад.'),
        ('What does the narrator drink?', 'Что пьёт рассказчик?', 'Ровӣ чӣ менӯшад?',
         ['Tea', 'Coffee', 'Milk'], 'Tea',
         'The narrator drinks tea with breakfast.', 'Рассказчик пьёт чай на завтрак.', 'Ровӣ ҳангоми наҳорӣ чой менӯшад.'),
        ('What does Sarah want instead of a sandwich?', 'Что Сара хочет вместо бутерброда?', 'Сара ба ҷои сэндвич чӣ мехоҳад?',
         ['Yogurt and fruit', 'Salad', 'Pasta'], 'Yogurt and fruit',
         "Sarah says 'I want yogurt and fruit.'", 'Сара говорит: «Я хочу йогурт и фрукты».', 'Сара мегӯяд: «Ман йогурт ва мева мехоҳам».'),
    ],
    29: [
        ('What does the narrator drink?', 'Что пьёт рассказчик?', 'Ровӣ чӣ менӯшад?',
         ['Tea', 'Coffee', 'Orange juice'], 'Tea',
         "The narrator works in a cafe but doesn't drink coffee, only tea.", 'Рассказчик работает в кафе, но не пьёт кофе, только чай.', 'Ровӣ дар кафе кор мекунад, вале қаҳва наменӯшад, танҳо чой.'),
        ('What is missing at the cafe?', 'Чего не хватает в кафе?', 'Дар кафе чӣ намерасад?',
         ['Milk', 'Sugar', 'Coffee'], 'Milk',
         "The narrator says 'we don't have milk.'", 'Рассказчик говорит: «у нас нет молока».', 'Ровӣ мегӯяд: «мо шир надорем».'),
        ('What does the cafe give instead of cereal?', 'Что дают в кафе вместо хлопьев?', 'Дар кафе ба ҷои гандумтак чӣ медиҳанд?',
         ['Eggs and toast', 'Fruit', 'Pasta'], 'Eggs and toast',
         "The narrator says 'We don't have cereal. We have eggs and toast.'", 'Рассказчик говорит: «У нас нет хлопьев. У нас есть яйца и тосты».', 'Ровӣ мегӯяд: «Мо гандумтак надорем. Мо тухм ва тост дорем».'),
    ],
    30: [
        ('What does the dog eat on the flight?', 'Что собака ест в полёте?', 'Саг дар парвоз чӣ мехӯрад?',
         ['Chicken', 'Meat', 'Fish'], 'Chicken',
         "The airline doesn't serve meat for dogs, only chicken.", 'Авиакомпания не подаёт мясо для собак, только курицу.', 'Ширкати ҳавопаймоӣ барои сагҳо гӯшт намедиҳад, танҳо мурғ.'),
        ('What does the narrator drink?', 'Что пьёт рассказчик?', 'Ровӣ чӣ менӯшад?',
         ['Wine', 'Water', 'Tea'], 'Wine',
         'The narrator drinks wine while the dog drinks water.', 'Рассказчик пьёт вино, а собака пьёт воду.', 'Ровӣ шароб менӯшад, саг бошад об.'),
        ('Where does the man next to the narrator work?', 'Где работает мужчина рядом с рассказчиком?', 'Марди дар паҳлӯи ровӣ дар куҷо кор мекунад?',
         ['A bank', 'A school', 'A hospital'], 'A bank',
         "He says 'I work in a bank.'", 'Он говорит: «Я работаю в банке».', 'Ӯ мегӯяд: «Ман дар бонк кор мекунам».'),
    ],
    31: [
        ('Who makes the Sunday lunch?', 'Кто готовит воскресный обед?', 'Хӯроки якшанбегиро кӣ тайёр мекунад?',
         ['Grandmother', 'Mother', 'Father'], 'Grandmother',
         'They have lunch at grandmother\'s house and she makes the soup and pasta.', 'Они обедают у бабушки, и она готовит суп и пасту.', 'Онҳо назди бибӣ хӯрок мехӯранд ва вай шӯрбо ва макарон мепазад.'),
        ('What does the grandfather drink?', 'Что пьёт дедушка?', 'Бобо чӣ менӯшад?',
         ['Wine and beer', 'Tea and coffee', 'Orange juice'], 'Wine and beer',
         "The grandfather drinks wine and beer, not tea or coffee.", 'Дедушка пьёт вино и пиво, а не чай и кофе.', 'Бобо шароб ва пиво менӯшад, на чой ва қаҳва.'),
        ('What does the narrator like?', 'Что любит рассказчик?', 'Ровӣ чиро дӯст медорад?',
         ['Chocolate', 'Cheese', 'Fruit'], 'Chocolate',
         'The narrator says "I like chocolate."', 'Рассказчик говорит: «Мне нравится шоколад».', 'Ровӣ мегӯяд: «Ман шоколадро дӯст медорам».'),
    ],
    32: [
        ('What tea does the narrator like?', 'Какой чай любит рассказчик?', 'Ровӣ кадом чойро дӯст медорад?',
         ['Green tea', 'Black tea', 'No tea'], 'Green tea',
         "The narrator says 'I don't like black tea. I like green tea.'", 'Рассказчик говорит: «Я не люблю чёрный чай. Я люблю зелёный чай».', 'Ровӣ мегӯяд: «Ман чойи сиёҳро дӯст намедорам. Ман чойи сабзро дӯст медорам».'),
        ('What does the narrator want instead of sandwiches?', 'Что рассказчик хочет вместо бутербродов?', 'Ровӣ ба ҷои сэндвич чӣ мехоҳад?',
         ['Fruit and yogurt', 'Cereal', 'Toast'], 'Fruit and yogurt',
         "The narrator says 'I like fruit and yogurt.'", 'Рассказчик говорит: «Мне нравятся фрукты и йогурт».', 'Ровӣ мегӯяд: «Мева ва йогурт ба ман маъқул аст».'),
        ('What does the cafe give instead of yogurt?', 'Что дают в кафе вместо йогурта?', 'Дар кафе ба ҷои йогурт чӣ медиҳанд?',
         ['Cereal', 'Fruit', 'Toast'], 'Cereal',
         "They say 'We don't have yogurt. We have cereal.'", 'Ему говорят: «У нас нет йогурта. У нас есть хлопья».', 'Ба ӯ мегӯянд: «Мо йогурт надорем. Мо гандумтак дорем».'),
    ],
    33: [
        ('What time does the sister get up?', 'Во сколько сестра встаёт?', 'Хоҳар соати чанд бармехезад?',
         ['6.00', '7.00', '8.00'], '6.00',
         'The nurse gets up at 6.00 every morning.', 'Медсестра встаёт каждое утро в 6.00.', 'Ҳамшираи тиббӣ ҳар субҳ соати 6.00 бармехезад.'),
        ('What does the husband teach?', 'Чему учит муж?', 'Шавҳар чиро таълим медиҳад?',
         ['French', 'English', 'Maths'], 'French',
         'The husband is a teacher who teaches French.', 'Муж — учитель, преподаёт французский.', 'Шавҳар муаллим аст ва забони фаронсавиро таълим медиҳад.'),
        ("What is the daughter's job?", 'Кем работает дочь?', 'Духтар бо кадом касб кор мекунад?',
         ['Journalist', 'Nurse', 'Teacher'], 'Journalist',
         'The daughter is a journalist who writes for a newspaper.', 'Дочь — журналист, пишет для газеты.', 'Духтар журналист аст ва барои рӯзнома менависад.'),
    ],
    34: [
        ('What time does the waiter usually get up?', 'Во сколько обычно встаёт официант?', 'Пешхидмат одатан соати чанд бармехезад?',
         ['10.00', '6.00', '8.00'], '10.00',
         'The lazy waiter usually gets up at 10.00.', 'Ленивый официант обычно встаёт в 10.00.', 'Пешхидмати танбал одатан соати 10.00 бармехезад.'),
        ('What does the boss say the waiter never does?', 'Что, по словам босса, официант никогда не делает?', 'Саркор мегӯяд, ки пешхидмат ҳеҷ гоҳ чӣ намекунад?',
         ['Work hard', 'Smile', 'Arrive on time'], 'Work hard',
         "The boss says 'You never work hard.'", 'Босс говорит: «Ты никогда не работаешь усердно».', 'Саркор мегӯяд: «Ту ҳеҷ гоҳ сахт кор намекунӣ».'),
        ('What does the waiter become by the end?', 'Кем становится официант в конце?', 'Дар охир пешхидмат чӣ мешавад?',
         ['A great waiter', 'A manager', 'A cook'], 'A great waiter',
         'After trying harder, he becomes a great waiter.', 'Приложив больше усилий, он становится отличным официантом.', 'Пас аз кӯшиши бештар, ӯ пешхидмати аъло мешавад.'),
    ],
    35: [
        ('What time does the aunt get up?', 'Во сколько встаёт тётя?', 'Аммаи чи соати чанд бармехезад?',
         ['5.00', '6.00', '7.00'], '5.00',
         'The policewoman always gets up at 5.00.', 'Женщина-полицейский всегда встаёт в 5.00.', 'Зани полис ҳамеша соати 5.00 бармехезад.'),
        ("What is the aunt's job?", 'Кем работает тётя?', 'Аммаи чи бо кадом касб кор мекунад?',
         ['Policewoman', 'Nurse', 'Taxi driver'], 'Policewoman',
         'The aunt is a policewoman.', 'Тётя — женщина-полицейский.', 'Аммаи чи зани полис аст.'),
        ("What is the husband's job?", 'Кем работает муж?', 'Шавҳар бо кадом касб кор мекунад?',
         ['Taxi driver', 'Policeman', 'Teacher'], 'Taxi driver',
         'The husband is a taxi driver.', 'Муж — водитель такси.', 'Шавҳар ронандаи такси аст.'),
    ],
    36: [
        ("What is Tom's job?", 'Кем работает Том?', 'Том бо кадом касб кор мекунад?',
         ['Receptionist', 'Waiter', 'Teacher'], 'Receptionist',
         'Tom works in an office as a receptionist.', 'Том работает в офисе администратором.', 'Том дар идора ҳамчун ресепшенист кор мекунад.'),
        ('What does Tom buy at the cafe?', 'Что Том покупает в кафе?', 'Том дар кафе чӣ мехарад?',
         ['Coffee and a croissant', 'Tea and toast', 'Just coffee'], 'Coffee and a croissant',
         'Tom has a coffee and a croissant at the cafe.', 'Том пьёт кофе и ест круассан в кафе.', 'Том дар кафе қаҳва менӯшад ва круассан мехӯрад.'),
        ("What does the colleague's husband do?", 'Где работает муж коллеги?', 'Шавҳари ҳамкор дар куҷо кор мекунад?',
         ['A factory', 'An office', 'A cafe'], 'A factory',
         'She says her husband works in a factory.', 'Она говорит, что её муж работает на заводе.', 'Вай мегӯяд, ки шавҳараш дар корхона кор мекунад.'),
    ],
    37: [
        ('What does the student study?', 'Что изучает студент?', 'Донишҷӯ чиро меомӯзад?',
         ['Economics', 'English', 'History'], 'Economics',
         'The narrator studies economics at university.', 'Рассказчик изучает экономику в университете.', 'Ровӣ дар донишгоҳ иқтисодиётро меомӯзад.'),
        ('What time does the student get up?', 'Во сколько встаёт студент?', 'Донишҷӯ соати чанд бармехезад?',
         ['7.30', '9.00', '6.00'], '7.30',
         'The student gets up at 7.30 every day.', 'Студент встаёт каждый день в 7.30.', 'Донишҷӯ ҳар рӯз соати 7.30 бармехезад.'),
        ('Where does the student go in the afternoon?', 'Куда студент идёт днём?', 'Донишҷӯ рӯзона ба куҷо меравад?',
         ['The library', 'The gym', 'Home'], 'The library',
         'In the afternoon the student goes to the library to study.', 'Днём студент идёт в библиотеку заниматься.', 'Рӯзона донишҷӯ барои дарс хондан ба китобхона меравад.'),
    ],
}


async def main():
    async with AsyncSessionLocal() as db:
        created = 0
        for story_id, questions in Q.items():
            for text_en, text_ru, text_tg, options, answer, expl_en, expl_ru, expl_tg in questions:
                db.add(StoryQuestions(
                    story_id=story_id,
                    text_en=text_en,
                    text_ru=text_ru,
                    text_tg=text_tg,
                    options=options,
                    answer=answer,
                    explanation_en=expl_en,
                    explanation_ru=expl_ru,
                    explanation_tg=expl_tg,
                ))
                created += 1
        await db.commit()
        print(f'created {created} story questions for {len(Q)} stories')


asyncio.run(main())
