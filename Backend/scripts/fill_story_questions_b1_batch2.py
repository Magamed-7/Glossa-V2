import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.database import AsyncSessionLocal
from app.models.model_content import StoryQuestions

Q = {
    114: [
        ('Why was Karim late?', 'Почему Карим опоздал?', 'Карим чаро дер монд?',
         ['A traffic jam', 'He overslept', 'His car broke down'], 'A traffic jam',
         'A sudden traffic jam delayed Karim for almost an hour.', 'Внезапная пробка задержала Карима почти на час.', 'Тирбанди ногаҳонӣ Каримро қариб як соат дер кард.'),
        ("Why didn't Karim know about the new meeting time?", 'Почему Карим не знал о новом времени встречи?', 'Карим чаро аз вақти нави ҷаласа хабар надошт?',
         ["His phone was on silent", 'He was on holiday', 'Nobody sent an email'], "His phone was on silent",
         "Karim's phone had been on silent all morning, so he missed the calls and hadn't checked his email.", 'Телефон Карима всё утро был на беззвучном режиме, поэтому он пропустил звонки.', 'Телефони Карим тамоми пагоҳирӯзӣ бе садо буд, аз ин рӯ зангҳоро надид.'),
        ('What had the team already agreed on?', 'О чём команда уже договорилась?', 'Гурӯҳ аллакай дар бораи чӣ мувофиқа кардааст?',
         ['A new deadline', 'A new manager', 'A new project'], 'A new deadline',
         'The team had already agreed on a new deadline without Karim.', 'Команда уже договорилась о новом сроке без Карима.', 'Гурӯҳ бе Карим аллакай дар бораи мӯҳлати нав мувофиқа кардааст.'),
    ],
    115: [
        ("What did Malika's husband say about the shopping?", 'Что муж Малики сказал о покупках?', 'Шавҳари Малика дар бораи харид чӣ гуфт?',
         ['He would try, not definitely finish it', 'He would definitely finish it', 'He forgot about it completely'], 'He would try, not definitely finish it',
         'He says he told her he would try, not that he would definitely finish the shopping.', 'Он говорит, что сказал ей «попробую», а не «точно закончу».', 'Ӯ мегӯяд, ки гуфта буд «кӯшиш мекунам», на «ҳатман тамом мекунам».'),
        ('Does grandma admit saying the soup needed more salt?', 'Признаёт ли бабушка, что говорила о недостатке соли в супе?', 'Оё бибӣ эътироф мекунад, ки дар бораи камии намак дар шӯрбо гуфтааст?',
         ['No, she denies it', 'Yes, immediately', 'She stays silent'], 'No, she denies it',
         "Grandma insists she said no such thing.", 'Бабушка настаивает, что не говорила ничего подобного.', 'Бибӣ исрор мекунад, ки чунин чизе нагуфтааст.'),
        ('What question makes everyone agree immediately?', 'Какой вопрос заставляет всех сразу согласиться?', 'Кадом савол ҳамаро фавран розӣ мекунад?',
         ['Who wants dessert?', 'Who broke the vase?', 'What happened at school?'], 'Who wants dessert?',
         'When Malika asks who wants dessert, every hand goes up immediately.', 'Когда Малика спрашивает, кто хочет десерт, все сразу поднимают руки.', 'Вақте ки Малика мепурсад, ки десертро кӣ мехоҳад, ҳама фавран даст мебардоранд.'),
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
