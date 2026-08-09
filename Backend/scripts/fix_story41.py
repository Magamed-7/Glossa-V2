import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories

WORD_DICTIONARY = {
    'often': {'ru': 'часто', 'tg': 'аксар вақт', 'lemma': 'often'},
    'have': {'ru': 'иметь', 'tg': 'доштан', 'lemma': 'have'},
    'nice': {'ru': 'приятный', 'tg': 'хуш', 'lemma': 'nice'},
    'weekend': {'ru': 'выходные', 'tg': 'рӯзи истироҳат', 'lemma': 'weekend'},
    'weekends': {'ru': 'выходные', 'tg': 'рӯзи истироҳат', 'lemma': 'weekend'},
    'meet': {'ru': 'встречать', 'tg': 'вохӯрдан', 'lemma': 'meet'},
    'friend': {'ru': 'друг', 'tg': 'дӯст', 'lemma': 'friend'},
    'friends': {'ru': 'друг', 'tg': 'дӯст', 'lemma': 'friend'},
    'go': {'ru': 'идти', 'tg': 'рафтан', 'lemma': 'go'},
    'restaurant': {'ru': 'ресторан', 'tg': 'тарабхона', 'lemma': 'restaurant'},
    'eat': {'ru': 'есть', 'tg': 'хӯрдан', 'lemma': 'eat'},
    'talk': {'ru': 'разговаривать', 'tg': 'гап задан', 'lemma': 'talk'},
    'cinema': {'ru': 'кинотеатр', 'tg': 'синамо', 'lemma': 'cinema'},
    'watch': {'ru': 'смотреть', 'tg': 'тамошо кардан', 'lemma': 'watch'},
    'comedy': {'ru': 'комедия', 'tg': 'комедия', 'lemma': 'comedy'},
    'laugh': {'ru': 'смеяться', 'tg': 'хандидан', 'lemma': 'laugh'},
    'lot': {'ru': 'много', 'tg': 'бисёр', 'lemma': 'lot'},
    'stay': {'ru': 'оставаться', 'tg': 'мондан', 'lemma': 'stay'},
    'home': {'ru': 'дом', 'tg': 'хона', 'lemma': 'home'},
    'cook': {'ru': 'готовить', 'tg': 'пухтан', 'lemma': 'cook'},
    'listen': {'ru': 'слушать', 'tg': 'гӯш кардан', 'lemma': 'listen'},
    'music': {'ru': 'музыка', 'tg': 'мусиқӣ', 'lemma': 'music'},
    'love': {'ru': 'любить', 'tg': 'дӯст доштан', 'lemma': 'love'},
    "don't": {'ru': 'делать', 'tg': 'кардан', 'lemma': 'do'},
    'work': {'ru': 'работать', 'tg': 'кор кардан', 'lemma': 'work'},
    'relax': {'ru': 'расслабляться', 'tg': 'истироҳат кардан', 'lemma': 'relax'},
    'sometimes': {'ru': 'иногда', 'tg': 'баъзан', 'lemma': 'sometimes'},
    'play': {'ru': 'играть', 'tg': 'бозидан', 'lemma': 'play'},
    'plays': {'ru': 'играть', 'tg': 'бозидан', 'lemma': 'play'},
    'tennis': {'ru': 'теннис', 'tg': 'теннис', 'lemma': 'tennis'},
    'swim': {'ru': 'плавать', 'tg': 'шино кардан', 'lemma': 'swim'},
    'piano': {'ru': 'фортепиано', 'tg': 'пианино', 'lemma': 'piano'},
    'good': {'ru': 'хороший', 'tg': 'хуб', 'lemma': 'good'},
    'very': {'ru': 'очень', 'tg': 'хеле', 'lemma': 'very'},
    'say': {'ru': 'говорить', 'tg': 'гуфтан', 'lemma': 'say'},
    'stop': {'ru': 'переставать', 'tg': 'бас кардан', 'lemma': 'stop'},
    'happy': {'ru': 'счастливый', 'tg': 'хушбахт', 'lemma': 'happy'},
    'walk': {'ru': 'гулять', 'tg': 'сайр кардан', 'lemma': 'walk'},
    'mountains': {'ru': 'гора', 'tg': 'кӯҳ', 'lemma': 'mountain'},
    'beautiful': {'ru': 'красивый', 'tg': 'зебо', 'lemma': 'beautiful'},
    'take': {'ru': 'брать (тж. фотографировать)', 'tg': 'гирифтан (тж. акс гирифтан)', 'lemma': 'take'},
    'photos': {'ru': 'фотография', 'tg': 'акс', 'lemma': 'photo'},
    'come': {'ru': 'приходить', 'tg': 'омадан', 'lemma': 'come'},
    'film': {'ru': 'фильм', 'tg': 'филм', 'lemma': 'film'},
    'science': {'ru': 'наука', 'tg': 'илм', 'lemma': 'science'},
    'fiction': {'ru': 'фантастика', 'tg': 'фантастика', 'lemma': 'fiction'},
    'sad': {'ru': 'грустный', 'tg': 'ғамгин', 'lemma': 'sad'},
    'ends': {'ru': 'заканчиваться', 'tg': 'тамом шудан', 'lemma': 'end'},
    'can': {'ru': 'мочь', 'tg': 'тавонистан', 'lemma': 'can'},
    'again': {'ru': 'снова', 'tg': 'боз', 'lemma': 'again'},
    'what': {'ru': 'что (тж. какой — в восклицании)', 'tg': 'чӣ (тж. кадом — дар нидо)', 'lemma': 'what'},
    'great': {'ru': 'отличный', 'tg': 'олӣ', 'lemma': 'great'},
    'are': {'ru': 'быть', 'tg': 'будан', 'lemma': 'be'},
    'is': {'ru': 'быть', 'tg': 'будан', 'lemma': 'be'},
}


async def main():
    async with AsyncSessionLocal() as db:
        story = (await db.execute(select(Stories).where(Stories.id == 41))).scalar_one()
        story.word_dictionary = WORD_DICTIONARY
        flag_modified(story, 'word_dictionary')
        db.add(story)
        await db.commit()
        print(f'story 41 replaced with {len(WORD_DICTIONARY)} hand-written entries')


if __name__ == '__main__':
    asyncio.run(main())
