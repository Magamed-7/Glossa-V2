import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.database import AsyncSessionLocal
from app.models.model_content import StoryQuestions

Q = {
    61: [
        ('What did the narrator forget?', 'Что забыл рассказчик?', 'Ровӣ чиро фаромӯш кард?',
         ['The documents', 'The report', 'His phone'], 'The documents',
         'The narrator left the documents at home.', 'Рассказчик оставил документы дома.', 'Ровӣ ҳуҷҷатҳоро дар хона монд.'),
        ('Who brought the documents?', 'Кто принёс документы?', 'Ҳуҷҷатҳоро кӣ овард?',
         ['His wife', 'His boss', 'A colleague'], 'His wife',
         'The narrator phoned his wife, and she brought the documents.', 'Рассказчик позвонил жене, и она принесла документы.', 'Ровӣ ба занаш занг зад ва вай ҳуҷҷатҳоро овард.'),
        ('What did the wife also bring?', 'Что ещё принесла жена?', 'Зан боз чӣ овард?',
         ['A sandwich', 'Coffee', 'A newspaper'], 'A sandwich',
         'The wife gave him a sandwich because he had not had breakfast.', 'Жена дала ему бутерброд, потому что он не позавтракал.', 'Зан ба ӯ сэндвич дод, зеро ӯ наҳорӣ накарда буд.'),
    ],
    62: [
        ('What time did the narrator get up?', 'Во сколько встал рассказчик?', 'Ровӣ соати чанд бархост?',
         ['8.00', '7.00', '9.00'], '8.00',
         "The story says 'I got up at 8.00.'", 'В истории сказано: «Я встал в 8.00».', 'Дар ҳикоя гуфта мешавад: «Ман соати 8.00 бархостам».'),
        ('What did the narrator buy while shopping?', 'Что рассказчик купил во время шопинга?', 'Ровӣ ҳангоми харид чӣ харид?',
         ['A new dress', 'A new phone', 'A book'], 'A new dress',
         'The narrator bought a new dress and a present for her sister.', 'Рассказчик купил новое платье и подарок для сестры.', 'Ровӣ куртаи нав ва тӯҳфа барои хоҳараш харид.'),
        ('What time did the narrator go to bed?', 'Во сколько рассказчик лёг спать?', 'Ровӣ соати чанд хоб рафт?',
         ['10.00', '11.00', '9.00'], '10.00',
         "The narrator says 'I went to bed at 10.00.'", 'Рассказчик говорит: «Я лёг спать в 10.00».', 'Ровӣ мегӯяд: «Ман соати 10.00 хоб рафтам».'),
    ],
    63: [
        ("What is the woman's name?", 'Как зовут женщину?', 'Номи зан чист?',
         ['Olivia', 'Maria', 'Anna'], 'Olivia',
         'The woman introduces herself as Olivia.', 'Женщина представляется как Оливия.', 'Зан худро Оливия муаррифӣ мекунад.'),
        ('What does the woman invite the narrator to?', 'Куда женщина приглашает рассказчика?', 'Зан ровиро ба куҷо даъват мекунад?',
         ['A concert', 'A restaurant', 'A cinema'], 'A concert',
         'She has two tickets for a concert and invites him.', 'У неё есть два билета на концерт, и она приглашает его.', 'Вай ду чипта ба консерт дорад ва ӯро даъват мекунад.'),
        ("What is the narrator's name?", 'Как зовут рассказчика?', 'Номи ровӣ чист?',
         ['David', 'Tom', 'Aziz'], 'David',
         "He says 'I'm David.'", 'Он говорит: «Я Дэвид».', 'Ӯ мегӯяд: «Ман Дэвид ҳастам».'),
    ],
    64: [
        ('Where was the missing ticket?', 'Где был потерянный билет?', 'Чиптаи гумшуда дар куҷо буд?',
         ['On the floor', 'In the coat', 'In the bag'], 'On the floor',
         'A woman finds the ticket on the floor.', 'Женщина находит билет на полу.', 'Зан чиптаро дар фарш меёбад.'),
        ('What kind of music did the narrator hear?', 'Какую музыку слышал рассказчик?', 'Ровӣ кадом мусиқиро шунид?',
         ['Classical music', 'Pop music', 'Jazz'], 'Classical music',
         'The narrator listened to classical music at the concert.', 'Рассказчик слушал классическую музыку на концерте.', 'Ровӣ дар консерт мусиқии классикиро гӯш кард.'),
        ('Why does the narrator want to keep the ticket?', 'Почему рассказчик хочет сохранить билет?', 'Ровӣ чаро чиптаро нигоҳ доштан мехоҳад?',
         ['As a souvenir', 'To get a refund', 'To show his friend'], 'As a souvenir',
         "The narrator says 'I need to keep it as a souvenir.'", 'Рассказчик говорит: «Мне нужно сохранить его как сувенир».', 'Ровӣ мегӯяд: «Ман бояд онро ҳамчун тӯҳфа нигоҳ дорам».'),
    ],
    65: [
        ('What seat should the narrator be in?', 'В каком месте должен сидеть рассказчик?', 'Ровӣ бояд дар кадом ҷой нишинад?',
         ['Seat 10', 'Seat 12', 'Seat 8'], 'Seat 10',
         'The ticket says seat 10, not seat 12.', 'В билете указано место 10, а не 12.', 'Дар чипта ҷои 10 нишон дода шудааст, на 12.'),
        ('What does the woman ask about?', 'О чём спрашивает женщина?', 'Зан дар бораи чӣ мепурсад?',
         ['Classical music', 'The weather', 'Football'], 'Classical music',
         "She asks 'Do you like classical music?'", 'Она спрашивает: «Тебе нравится классическая музыка?»', 'Вай мепурсад: «Мусиқии классикӣ ба ту маъқул аст?»'),
        ('What do they exchange?', 'Чем они обмениваются?', 'Онҳо бо чӣ мубодила мекунанд?',
         ['Phone numbers', 'Books', 'Tickets'], 'Phone numbers',
         'They exchange phone numbers and go to a concert together.', 'Они обмениваются номерами телефонов и вместе идут на концерт.', 'Онҳо рақами телефон мубодила мекунанд ва якҷоя ба консерт мераванд.'),
    ],
    66: [
        ('What time is the concert?', 'Во сколько концерт?', 'Консерт соати чанд аст?',
         ['8 p.m.', '7 p.m.', '9 p.m.'], '8 p.m.',
         "The message says 'Concert tonight, 8 p.m.'", 'В сообщении сказано: «Концерт сегодня вечером, 20:00».', 'Дар паём гуфта мешавад: «Консерт имшаб, соати 20:00».'),
        ('What kind of music is played?', 'Какая музыка звучит?', 'Кадом мусиқӣ садо медиҳад?',
         ['Classical', 'Pop', 'Rock'], 'Classical',
         'The music at the concert is classical.', 'Музыка на концерте классическая.', 'Мусиқии дар консерт классикӣ аст.'),
        ('What does the narrator smell?', 'Что чувствует рассказчик по запаху?', 'Ровӣ кадом бӯйро ҳис мекунад?',
         ['Perfume', 'Coffee', 'Flowers'], 'Perfume',
         'The narrator smells a nice perfume from the woman next to him.', 'Рассказчик чувствует приятный запах духов от женщины рядом.', 'Ровӣ бӯи хуши атри занеро, ки дар паҳлӯяш аст, ҳис мекунад.'),
    ],
    67: [
        ('What is the man on the train reading?', 'Что читает мужчина в поезде?', 'Мард дар поезд чӣ мехонад?',
         ['A book about classical music', 'A newspaper', 'A comic book'], 'A book about classical music',
         'The man is reading a book about classical music.', 'Мужчина читает книгу о классической музыке.', 'Мард дар бораи мусиқии классикӣ китоб мехонад.'),
        ('What does the man have two of?', 'Чего у мужчины два?', 'Мард аз чӣ ду дона дорад?',
         ['Tickets for a concert', 'Books', 'Phones'], 'Tickets for a concert',
         'He has two tickets for a concert tomorrow.', 'У него есть два билета на завтрашний концерт.', 'Ӯ ду чипта барои консерти пагоҳ дорад.'),
        ('What do the narrator and the man do now?', 'Что теперь делают рассказчик и мужчина?', 'Ровӣ ва мард ҳоло чӣ мекунанд?',
         ['Go to concerts together often', 'Write letters', "Don't see each other anymore"], 'Go to concerts together often',
         'They became friends and now often go to concerts together.', 'Они стали друзьями и теперь часто вместе ходят на концерты.', 'Онҳо дӯст шуданд ва ҳоло аксар вақт якҷоя ба консерт мераванд.'),
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
