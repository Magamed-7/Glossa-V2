import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories

WORD_DICTIONARY = {
    'want': {'ru': 'хотеть', 'tg': 'хостан', 'lemma': 'want'},
    'be': {'ru': 'быть', 'tg': 'будан', 'lemma': 'be'},
    'am': {'ru': 'быть', 'tg': 'будан', 'lemma': 'be'},
    'is': {'ru': 'быть', 'tg': 'будан', 'lemma': 'be'},
    'are': {'ru': 'быть', 'tg': 'будан', 'lemma': 'be'},
    'actor': {'ru': 'актёр', 'tg': 'актёр', 'lemma': 'actor'},
    'go': {'ru': 'идти', 'tg': 'рафтан', 'lemma': 'go'},
    'acting': {'ru': 'играть (актёрскую роль)', 'tg': 'бозӣ кардан (нақш)', 'lemma': 'act'},
    'act': {'ru': 'играть (роль)', 'tg': 'бозӣ кардан', 'lemma': 'act'},
    'acts': {'ru': 'играть (роль)', 'tg': 'бозӣ кардан', 'lemma': 'act'},
    'classes': {'ru': 'занятия', 'tg': 'дарсҳо', 'lemma': 'class'},
    'teacher': {'ru': 'учитель', 'tg': 'муаллим', 'lemma': 'teacher'},
    'says': {'ru': 'говорить', 'tg': 'гуфтан', 'lemma': 'say'},
    'say': {'ru': 'говорить', 'tg': 'гуфтан', 'lemma': 'say'},
    'quiet': {'ru': 'тихий', 'tg': 'ором', 'lemma': 'quiet'},
    'listen': {'ru': 'слушать', 'tg': 'гӯш кардан', 'lemma': 'listen'},
    'move': {'ru': 'двигаться', 'tg': 'ҳаракат кардан', 'lemma': 'move'},
    'anything': {'ru': 'что-нибудь (тж. ничего — с don\'t)', 'tg': 'чизе (тж. ҳеҷ чиз — бо инкор)', 'lemma': 'anything'},
    'just': {'ru': 'просто (только что)', 'tg': 'фақат', 'lemma': 'just'},
    'watch': {'ru': 'смотреть', 'tg': 'тамошо кардан', 'lemma': 'watch'},
    'me': {'ru': 'меня', 'tg': 'маро', 'lemma': 'me'},
    'scene': {'ru': 'сцена', 'tg': 'саҳна', 'lemma': 'scene'},
    'cries': {'ru': 'плакать', 'tg': 'гиря кардан', 'lemma': 'cry'},
    'laughs': {'ru': 'смеяться', 'tg': 'хандидан', 'lemma': 'laugh'},
    'now': {'ru': 'теперь', 'tg': 'ҳозир', 'lemma': 'now'},
    'you': {'ru': 'вы (ты)', 'tg': 'шумо', 'lemma': 'you'},
    'try': {'ru': 'пытаться', 'tg': 'кӯшиш кардан', 'lemma': 'try'},
    'do': {'ru': 'делать', 'tg': 'кардан', 'lemma': 'do'},
    "don't": {'ru': 'делать', 'tg': 'кардан', 'lemma': 'do'},
    'remember': {'ru': 'помнить', 'tg': 'дар ёд доштан', 'lemma': 'remember'},
    'words': {'ru': 'слово', 'tg': 'калима', 'lemma': 'word'},
    'worry': {'ru': 'беспокоиться', 'tg': 'ташвиш кашидан', 'lemma': 'worry'},
    'help': {'ru': 'помогать', 'tg': 'кӯмак кардан', 'lemma': 'help'},
    'repeat': {'ru': 'повторять', 'tg': 'такрор кардан', 'lemma': 'repeat'},
    'good': {'ru': 'хороший', 'tg': 'хуб', 'lemma': 'good'},
    'look': {'ru': 'смотреть', 'tg': 'нигоҳ кардан', 'lemma': 'look'},
    'her': {'ru': 'её', 'tg': 'ӯро', 'lemma': 'her'},
    'points': {'ru': 'указывать', 'tg': 'ишора кардан', 'lemma': 'point'},
    'another': {'ru': 'другой', 'tg': 'дигар', 'lemma': 'another'},
    'student': {'ru': 'ученик', 'tg': 'хонанда', 'lemma': 'student'},
    'your': {'ru': 'твой (ваш)', 'tg': 'ту (шумо)', 'lemma': 'your'},
    'partner': {'ru': 'партнёр', 'tg': 'ҳамкор', 'lemma': 'partner'},
    'talk': {'ru': 'разговаривать', 'tg': 'гап задан', 'lemma': 'talk'},
    'forget': {'ru': 'забывать', 'tg': 'фаромӯш кардан', 'lemma': 'forget'},
    'lines': {'ru': 'реплики (текст роли)', 'tg': 'сатрҳо (матни нақш)', 'lemma': 'line'},
    'stop': {'ru': 'переставать', 'tg': 'бас кардан', 'lemma': 'stop'},
    'continue': {'ru': 'продолжать', 'tg': 'давом додан', 'lemma': 'continue'},
    'make': {'ru': 'делать (совершать)', 'tg': 'кардан', 'lemma': 'make'},
    'mistake': {'ru': 'ошибка', 'tg': 'хато', 'lemma': 'mistake'},
    'learning': {'ru': 'учиться', 'tg': 'омӯхтан', 'lemma': 'learn'},
    'feel': {'ru': 'чувствовать', 'tg': 'ҳис кардан', 'lemma': 'feel'},
    'better': {'ru': 'лучше', 'tg': 'беҳтар', 'lemma': 'better'},
    'love': {'ru': 'любить', 'tg': 'дӯст доштан', 'lemma': 'love'},
    'will': {'ru': 'буду (вспом. буд. вр.)', 'tg': 'хоҳам (ёрирасони замони оянда)', 'lemma': 'will'},
    'become': {'ru': 'становиться', 'tg': 'шудан', 'lemma': 'become'},
    'one': {'ru': 'один', 'tg': 'як', 'lemma': 'one'},
    'day': {'ru': 'день', 'tg': 'рӯз', 'lemma': 'day'},
    'believe': {'ru': 'верить', 'tg': 'бовар кардан', 'lemma': 'believe'},
    'myself': {'ru': 'себя (сам)', 'tg': 'худам', 'lemma': 'myself'},
}


async def main():
    async with AsyncSessionLocal() as db:
        story = (await db.execute(select(Stories).where(Stories.id == 42))).scalar_one()
        story.word_dictionary = WORD_DICTIONARY
        flag_modified(story, 'word_dictionary')
        db.add(story)
        await db.commit()
        print(f'story 42 replaced with {len(WORD_DICTIONARY)} hand-written entries')


if __name__ == '__main__':
    asyncio.run(main())
