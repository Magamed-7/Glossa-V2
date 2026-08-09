import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.database import AsyncSessionLocal
from app.models.model_content import StoryQuestions

Q = {
    8: [
        ('Where is Maria from?', 'Откуда Мария?', 'Мария аз куҷост?',
         ['Mexico', 'Italy', 'Spain'], 'Mexico',
         "Maria says 'I am from Mexico.'", 'Мария говорит: «Я из Мексики».', 'Мария мегӯяд: «Ман аз Мексика ҳастам».'),
        ('Why is Maria confused at first?', 'Почему Мария сначала растеряна?', 'Чаро Мария дар аввал гиҷ мешавад?',
         ['She thinks the cafe is the classroom', 'She is late', 'She lost her book'], 'She thinks the cafe is the classroom',
         'She asks a man in a cafe if it is the classroom.', 'Она спрашивает мужчину в кафе, не классная ли это комната.', 'Вай аз марди дар кафе буда мепурсад, ки оё ин синфхона аст.'),
        ('Where is the teacher from?', 'Откуда учительница?', 'Муаллима аз куҷост?',
         ['the UK', 'Mexico', 'Italy'], 'the UK',
         "The teacher says 'I'm from the UK.'", 'Учительница говорит: «Я из Великобритании».', 'Муаллима мегӯяд: «Ман аз Британияи Кабир ҳастам».'),
    ],
    9: [
        ('Where is Anna from?', 'Откуда Анна?', 'Анна аз куҷост?',
         ['Italy', 'the UK', 'Brazil'], 'Italy',
         "Anna says 'I'm from Italy.'", 'Анна говорит: «Я из Италии».', 'Анна мегӯяд: «Ман аз Италия ҳастам».'),
        ('Where does Tom leave his phone?', 'Где Том оставил телефон?', 'Том телефони худро дар куҷо мондааст?',
         ['At the hotel', 'At the cafe', 'On the bus'], 'At the hotel',
         "Tom says his phone is at the hotel, in his room.", 'Том говорит, что его телефон в отеле, в его номере.', 'Том мегӯяд, ки телефонаш дар меҳмонхона, дар утоқаш аст.'),
        ('Where do Tom and Anna agree to meet?', 'Где Том и Анна договариваются встретиться?', 'Том ва Анна дар куҷо вохӯрданро розӣ мешаванд?',
         ['At the cafe', 'At the hotel', 'At the airport'], 'At the cafe',
         "Tom suggests meeting at the cafe for a cappuccino.", 'Том предлагает встретиться в кафе выпить капучино.', 'Том пешниҳод мекунад, ки дар кафе барои капучино вохӯранд.'),
    ],
    10: [
        ('Where is the dog from?', 'Откуда собака?', 'Саг аз куҷост?',
         ['Germany', 'France', 'Spain'], 'Germany',
         "The narrator says the dog is not French, it is from Germany.", 'Рассказчик говорит, что собака не французская, она из Германии.', 'Ровӣ мегӯяд, ки саг фаронсавӣ нест, вай аз Олмон аст.'),
        ("What is the dog's name?", 'Как зовут собаку?', 'Номи саг чист?',
         ['Zero', 'Max', 'Rex'], 'Zero',
         "The owner says the dog's name is Zero.", 'Хозяин говорит, что собаку зовут Зеро.', 'Соҳиб мегӯяд, ки номи саг Зеро аст.'),
        ('Where is the dog\'s owner from?', 'Откуда хозяин собаки?', 'Соҳиби саг аз куҷост?',
         ['Spain', 'Germany', 'France'], 'Spain',
         'The owner is from Spain.', 'Хозяин собаки из Испании.', 'Соҳиби саг аз Испания аст.'),
    ],
    11: [
        ("What is the teacher's name?", 'Как зовут учительницу?', 'Номи муаллима чист?',
         ['Susan', 'Maria', 'Anna'], 'Susan',
         "The teacher introduces herself as Susan.", 'Учительница представляется как Сьюзан.', 'Муаллима худро Сюзан муаррифӣ мекунад.'),
        ('Where is Ali from?', 'Откуда Али?', 'Алӣ аз куҷост?',
         ['Turkey', 'Spain', 'Italy'], 'Turkey',
         "Ali says 'I am from Turkey.'", 'Али говорит: «Я из Турции».', 'Алӣ мегӯяд: «Ман аз Туркия ҳастам».'),
        ('How does Ali spell "book"?', 'Как Али произносит по буквам слово "book"?', 'Алӣ калимаи "book"-ро чӣ тавр ҳарф ба ҳарф мегӯяд?',
         ['B-O-O-K', 'B-O-K', 'B-U-K'], 'B-O-O-K',
         "Ali spells it correctly as B-O-O-K.", 'Али произносит его правильно: Б-О-О-К.', 'Алӣ онро дуруст мегӯяд: Б-О-О-К.'),
    ],
    12: [
        ('Where is the narrator from?', 'Откуда рассказчик?', 'Ровӣ аз куҷост?',
         ['Poland', 'Brazil', 'Japan'], 'Poland',
         "The narrator says 'I am from Poland.'", 'Рассказчик говорит: «Я из Польши».', 'Ровӣ мегӯяд: «Ман аз Полша ҳастам».'),
        ('What does the teacher point to as a joke about England?', 'На что учительница шутливо указывает про Англию?', 'Муаллима барои ҳазл дар бораи Англия ба чӣ ишора мекунад?',
         ['A dog', 'A map', 'A book'], 'A dog',
         "The narrator points at a dog and jokes it is from England; the teacher says dogs are from everywhere.", 'Рассказчик указывает на собаку в шутку, а учительница отвечает, что собаки «отовсюду».', 'Ровӣ бо ҳазл ба саг ишора мекунад, вале муаллима мегӯяд, ки сагҳо «аз ҳама ҷо» ҳастанд.'),
        ('What page do they open the book to?', 'На какую страницу они открывают книгу?', 'Китобро ба кадом саҳифа мекушоянд?',
         ['Page 5', 'Page 10', 'Page 1'], 'Page 5',
         "The teacher says to open the books to page five.", 'Учительница просит открыть книги на пятой странице.', 'Муаллима мегӯяд, ки китобҳоро ба саҳифаи панҷум кушоянд.'),
    ],
    13: [
        ('Where are the tourists from?', 'Откуда туристы?', 'Сайёҳон аз куҷост?',
         ['Brazil', 'England', 'Japan'], 'Brazil',
         "They say 'We're from Brazil.'", 'Они говорят: «Мы из Бразилии».', 'Онҳо мегӯянд: «Мо аз Бразилия ҳастем».'),
        ('What are the tourists looking for?', 'Что ищут туристы?', 'Сайёҳон чиро меҷӯянд?',
         ['A bus stop', 'A hotel', 'A cafe'], 'A bus stop',
         "The story says they want to find a bus stop.", 'В истории сказано, что они хотят найти автобусную остановку.', 'Дар ҳикоя гуфта мешавад, ки онҳо истгоҳи автобусро меҷӯянд.'),
        ('How old is their guide?', 'Сколько лет их гиду?', 'Роҳбалади онҳо чандсола аст?',
         ['33', '25', '19'], '33',
         "They say the guide is 33.", 'Они говорят, что гиду 33 года.', 'Онҳо мегӯянд, ки роҳбалад 33-сола аст.'),
    ],
    14: [
        ('What class are the new students in?', 'В каком классе новые студенты?', 'Донишҷӯёни нав дар кадом синф ҳастанд?',
         ['2A', '2B', '1A'], '2A',
         "The story says they are in class 2A.", 'В истории сказано, что они в классе 2A.', 'Дар ҳикоя гуфта мешавад, ки онҳо дар синфи 2A ҳастанд.'),
        ('Where are the new students from?', 'Откуда новые студенты?', 'Донишҷӯёни нав аз куҷо ҳастанд?',
         ['Japan', 'Brazil', 'China'], 'Japan',
         "They say 'We are from Japan.'", 'Они говорят: «Мы из Японии».', 'Онҳо мегӯянд: «Мо аз Япония ҳастем».'),
        ('How old is their friend from Brazil?', 'Сколько лет их другу из Бразилии?', 'Дӯсти онҳо аз Бразилия чандсола аст?',
         ['25', '20', '33'], '25',
         "They say their friend is 25.", 'Они говорят, что их другу 25 лет.', 'Онҳо мегӯянд, ки дӯсташон 25-сола аст.'),
    ],
    15: [
        ('What bus number do the tourists need?', 'Какой номер автобуса нужен туристам?', 'Ба сайёҳон автобуси рақами чанд лозим аст?',
         ['10', '5', '2'], '10',
         "The man tells them 'Yours is number 10.'", 'Мужчина говорит им: «Ваш — номер 10».', 'Мард ба онҳо мегӯяд: «Автобуси шумо рақами 10 аст».'),
        ("What are the two dogs' names?", 'Как зовут двух собак?', 'Номи ду саг чист?',
         ['One and Two', 'Rex and Max', 'Zero and One'], 'One and Two',
         "The woman says the dogs are called One and Two.", 'Женщина говорит, что собак зовут Один и Два.', 'Зан мегӯяд, ки номи сагҳо Як ва Ду аст.'),
        ('Where are the tourists from?', 'Откуда туристы?', 'Сайёҳон аз куҷост?',
         ['Switzerland', 'Germany', 'the UK'], 'Switzerland',
         "The story says 'We are from Switzerland.'", 'В истории сказано: «Мы из Швейцарии».', 'Дар ҳикоя гуфта мешавад: «Мо аз Швейтсария ҳастем».'),
    ],
    16: [
        ('Where is the family from?', 'Откуда семья?', 'Оила аз куҷост?',
         ['China', 'Italy', 'the UK'], 'China',
         "The story starts 'We are from China.'", 'История начинается со слов «Мы из Китая».', 'Ҳикоя бо ҷумлаи «Мо аз Чин ҳастем» оғоз мешавад.'),
        ("What is the neighbours' job?", 'Кем работают соседи?', 'Ҳамсояҳо бо кадом касб кор мекунанд?',
         ['Artists', 'Teachers', 'Doctors'], 'Artists',
         "The neighbours say 'We are artists.'", 'Соседи говорят: «Мы художники».', 'Ҳамсояҳо мегӯянд: «Мо рассом ҳастем».'),
        ("How old is the neighbours' son?", 'Сколько лет сыну соседей?', 'Писари ҳамсояҳо чандсола аст?',
         ['19', '25', '17'], '19',
         'They say their son is 19.', 'Они говорят, что их сыну 19 лет.', 'Онҳо мегӯянд, ки писарашон 19-сола аст.'),
    ],
    17: [
        ('How old is Juan?', 'Сколько лет Хуану?', 'Хуан чандсола аст?',
         ['20', '19', '25'], '20',
         "The class says Juan is 20.", 'Класс говорит, что Хуану 20 лет.', 'Синф мегӯяд, ки Хуан 20-сола аст.'),
        ('Where is Juan from?', 'Откуда Хуан?', 'Хуан аз куҷост?',
         ['Mexico', 'Spain', 'Turkey'], 'Mexico',
         "Juan is from Mexico.", 'Хуан из Мексики.', 'Хуан аз Мексика аст.'),
        ('How do they spell "window"?', 'Как они произносят по буквам "window"?', '"Window"-ро чӣ тавр ҳарф ба ҳарф мегӯянд?',
         ['W-I-N-D-O-W', 'W-I-N-D-O', 'V-I-N-D-O-W'], 'W-I-N-D-O-W',
         'The class spells it correctly.', 'Класс произносит слово правильно.', 'Синф калимаро дуруст мегӯяд.'),
    ],
    18: [
        ('Where does the narrator find the keys?', 'Где рассказчик находит ключи?', 'Ровӣ калидҳоро дар куҷо меёбад?',
         ['Under the table', 'In the bag', 'In the pocket'], 'Under the table',
         "The narrator finds the keys under the table.", 'Рассказчик находит ключи под столом.', 'Ровӣ калидҳоро дар зери миз меёбад.'),
        ('What souvenir does the narrator buy?', 'Какой сувенир покупает рассказчик?', 'Ровӣ кадом тӯҳфаро мехарад?',
         ['A T-shirt', 'A mug', 'A key ring'], 'A T-shirt',
         "At the end, the narrator buys a T-shirt as a souvenir.", 'В конце рассказчик покупает футболку в качестве сувенира.', 'Дар охир ровӣ ҳамчун тӯҳфа футболка мехарад.'),
        ("What does the woman call her sunglasses?", 'Как женщина называет свои тёмные очки?', 'Зан айнаки офтобии худро чӣ мегӯяд?',
         ['Sunglasses', 'Glasses', 'A camera'], 'Sunglasses',
         "She corrects the narrator: 'those are my sunglasses.'", 'Она поправляет рассказчика: «это мои солнечные очки».', 'Вай ровиро ислоҳ мекунад: «ин айнаки офтобии ман аст».'),
    ],
    19: [
        ('How much is the mug?', 'Сколько стоит кружка?', 'Пиёла чанд пул аст?',
         ['£5', '£8', '£2'], '£5',
         "The shopkeeper says the mug is £5.", 'Продавец говорит, что кружка стоит £5.', 'Фурӯшанда мегӯяд, ки пиёла £5 меарзад.'),
        ('How does the narrator finally pay?', 'Чем в итоге расплачивается рассказчик?', 'Дар охир ровӣ бо чӣ пул медиҳад?',
         ['A debit card', 'Cash', 'A credit card'], 'A debit card',
         "The credit card is refused, so he pays with a debit card.", 'Кредитную карту не приняли, поэтому он платит дебетовой картой.', 'Кортҳои кредитиро қабул намекунанд, аз ин рӯ ӯ бо корти дебетӣ пул медиҳад.'),
        ('What does the shopkeeper not accept?', 'Что не принимает продавец?', 'Фурӯшанда чиро қабул намекунад?',
         ['Credit cards', 'Cash', 'Debit cards'], 'Credit cards',
         "He says 'we don't take credit cards. Only cash.'", 'Он говорит: «мы не принимаем кредитные карты, только наличные».', 'Ӯ мегӯяд: «мо кортҳои кредитиро қабул намекунем, танҳо нақд».'),
    ],
    20: [
        ('What do the two women realize?', 'Что понимают обе женщины?', 'Ду зан чиро мефаҳманд?',
         ['They picked up the wrong bag', 'They lost their tickets', 'They missed the flight'], 'They picked up the wrong bag',
         'Their bags look the same, so they each took the wrong one.', 'Их сумки похожи, поэтому каждая взяла не свою.', 'Ҷузвдонҳояшон монанданд, аз ин рӯ ҳар кас ҷузвдони каси дигарро гирифт.'),
        ("What is in the narrator's bag?", 'Что в сумке рассказчика?', 'Дар ҷузвдони ровӣ чист?',
         ['A wallet and keys', 'A phone and charger', 'A passport'], 'A wallet and keys',
         "The other woman describes it: 'This has a wallet and keys.'", 'Другая женщина описывает её: «Здесь кошелёк и ключи».', 'Зани дигар онро тавсиф мекунад: «Дар ин ҷо ҳамён ва калидҳо ҳастанд».'),
        ("What is in the other woman's bag?", 'Что в сумке другой женщины?', 'Дар ҷузвдони зани дигар чист?',
         ['A phone and charger', 'A wallet and keys', 'A book'], 'A phone and charger',
         "She says 'I have a phone and a charger.'", 'Она говорит: «У меня телефон и зарядное устройство».', 'Вай мегӯяд: «Ман телефон ва заряднок дорам».'),
    ],
    21: [
        ('What has a flag of England on it?', 'На чём изображён флаг Англии?', 'Дар куҷо парчами Англия кашида шудааст?',
         ['The mug', 'The plate', 'The T-shirt'], 'The mug',
         "The narrator says 'I like this mug. It has a flag of England.'", 'Рассказчик говорит: «Мне нравится эта кружка, на ней флаг Англии».', 'Ровӣ мегӯяд: «Ин пиёла ба ман маъқул аст, дар он парчами Англия ҳаст».'),
        ('How much is the teddy?', 'Сколько стоит плюшевый мишка?', 'Хирси пахмоқ чанд пул аст?',
         ['£10', '£8', '£3'], '£10',
         'The shop assistant says the teddy is £10.', 'Продавец говорит, что мишка стоит £10.', 'Фурӯшанда мегӯяд, ки хирс £10 меарзад.'),
        ('What is the total price?', 'Какова общая цена?', 'Нархи умумӣ чанд аст?',
         ['£18', '£8', '£3'], '£18',
         'The mug and the teddy together cost £18.', 'Кружка и мишка вместе стоят £18.', 'Пиёла ва хирс якҷоя £18 меарзанд.'),
    ],
    22: [
        ('Where does the narrator find the phone?', 'Где рассказчик находит телефон?', 'Ровӣ телефонро дар куҷо меёбад?',
         ['Under a newspaper', 'Under the bed', 'In the bag'], 'Under a newspaper',
         'The narrator finds the phone under a newspaper in the restaurant.', 'Рассказчик находит телефон под газетой в ресторане.', 'Ровӣ телефонро дар зери рӯзнома дар тарабхона меёбад.'),
        ('Where does the narrator look first?', 'Куда рассказчик обращается сначала?', 'Ровӣ аввал ба куҷо мурожиат мекунад?',
         ['Reception', 'The restaurant', 'The bar'], 'Reception',
         'The narrator first goes to reception to ask about the phone.', 'Рассказчик сначала идёт на ресепшен спросить о телефоне.', 'Ровӣ аввал ба реsepшн мераваду дар бораи телефон мепурсад.'),
        ('What phone does the man in the restaurant have?', 'Какой телефон у мужчины в ресторане?', 'Марди дар тарабхона кадом телефон дорад?',
         ['A Samsung', 'An iPhone', 'No phone'], 'A Samsung',
         "He says 'my phone is a Samsung.'", 'Он говорит: «мой телефон — Samsung».', 'Ӯ мегӯяд: «телефони ман Samsung аст».'),
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
