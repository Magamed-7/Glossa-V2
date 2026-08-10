import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
import app.models.model_user  # noqa: F401 - registers users for FK resolution
from app.models.model_content import GrammarLessons, Stories, VocabEntries
from app.models.model_course import CourseUnit, CourseUnitStories, CourseUnitVocab

# index into the 18 C2 grammar lessons (seed:C2:grammar:<idx>) -> C2 story index (seed:C2:story:<idx>) or None
STORY_FOR_LESSON = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
    8: None, 9: 8, 10: 9, 11: 10, 12: None, 13: None,
    14: None, 15: None, 16: 11, 17: None,
}

# 18 units, in lesson order (1A..9B). vocab_group matches seed_c2_vocab.py's unit grouping ('1'..'9').
UNITS = [
    {'unit_code': '1A', 'group': '1', 'title_en': 'Hedging and Modality', 'title_ru': 'Смягчение и модальность', 'title_tg': 'Мулоимкунӣ ва модалӣ'},
    {'unit_code': '1B', 'group': '1', 'title_en': 'Historic Present & Free Indirect Style', 'title_ru': 'Историческое настоящее и свободный косвенный стиль', 'title_tg': 'Замони ҳозираи таърихӣ'},
    {'unit_code': '2A', 'group': '2', 'title_en': 'Complex Noun Phrases', 'title_ru': 'Сложные именные группы', 'title_tg': 'Гурӯҳҳои исмии мураккаб'},
    {'unit_code': '2B', 'group': '2', 'title_en': 'Cleft & Pseudo-Cleft Sentences', 'title_ru': 'Cleft- и псевдо-cleft-предложения', 'title_tg': 'Ҷумлаҳои cleft ва псевдо-cleft'},
    {'unit_code': '3A', 'group': '3', 'title_en': 'Ellipsis in Formal & Informal English', 'title_ru': 'Эллипсис в формальном и неформальном английском', 'title_tg': 'Эллипсис дар забони расмӣ ва ғайрирасмӣ'},
    {'unit_code': '3B', 'group': '3', 'title_en': 'Inversion After Negative Adverbials', 'title_ru': 'Инверсия после отрицательных наречий', 'title_tg': 'Инверсия пас аз зарфҳои манфӣ'},
    {'unit_code': '4A', 'group': '4', 'title_en': 'Inversion in Conditionals Without If', 'title_ru': 'Инверсия в условных без if', 'title_tg': 'Инверсия дар ҷумлаи шартӣ бе if'},
    {'unit_code': '4B', 'group': '4', 'title_en': 'Register: Formal vs Informal Grammar', 'title_ru': 'Регистр: формальная и неформальная грамматика', 'title_tg': 'Регистр: грамматикаи расмӣ ва ғайрирасмӣ'},
    {'unit_code': '5A', 'group': '5', 'title_en': 'Fronting & Extraposition', 'title_ru': 'Вынесение и экстрапозиция', 'title_tg': 'Пешоварӣ ва экстрапозитсия'},
    {'unit_code': '5B', 'group': '5', 'title_en': 'Nominalisation for Formal Tone', 'title_ru': 'Номинализация для формального стиля', 'title_tg': 'Номинализатсия барои услуби расмӣ'},
    {'unit_code': '6A', 'group': '6', 'title_en': 'Mixed & Layered Conditionals', 'title_ru': 'Смешанные условные предложения', 'title_tg': 'Ҷумлаҳои шартии омехта'},
    {'unit_code': '6B', 'group': '6', 'title_en': 'Structural Ambiguity', 'title_ru': 'Структурная неоднозначность', 'title_tg': 'Норавшании сохторӣ'},
    {'unit_code': '7A', 'group': '7', 'title_en': 'Parallelism & Rhetorical Patterning', 'title_ru': 'Параллелизм и риторические приёмы', 'title_tg': 'Параллелизм ва усулҳои риторикӣ'},
    {'unit_code': '7B', 'group': '7', 'title_en': 'Discourse-Level Cohesion', 'title_ru': 'Связность на уровне дискурса', 'title_tg': 'Пайвастагӣ дар сатҳи дискурс'},
    {'unit_code': '8A', 'group': '8', 'title_en': 'Emphatic Do for Contrast', 'title_ru': 'Эмфатическое do для контраста', 'title_tg': "'Do'-и таъкидӣ барои муқобилгузорӣ"},
    {'unit_code': '8B', 'group': '8', 'title_en': 'Advanced Passive & Causative', 'title_ru': 'Продвинутый пассив и каузатив', 'title_tg': 'Мафъулии пешрафта ва каузатив'},
    {'unit_code': '9A', 'group': '9', 'title_en': 'Phrasal-Prepositional Verbs', 'title_ru': 'Фразово-предложные глаголы', 'title_tg': 'Феълҳои фразавӣ-пешояндӣ'},
    {'unit_code': '9B', 'group': '9', 'title_en': 'Fixed Idioms & Syntactic Flexibility', 'title_ru': 'Устойчивые идиомы и синтаксическая гибкость', 'title_tg': 'Идиомаҳои собит ва чандирии наҳвӣ'},
]

MIDPOINT_INDEX = 8  # 5A
FINAL_INDEX = 17  # 9B


async def main():
    async with AsyncSessionLocal() as db:
        base_seq = (
            await db.execute(select(CourseUnit.sequence_index).order_by(CourseUnit.sequence_index.desc()).limit(1))
        ).scalar_one()
        next_seq = base_seq + 1

        lessons_by_key = {}
        for idx in range(18):
            key = f'seed:C2:grammar:{idx}'
            lesson = (await db.execute(select(GrammarLessons).where(GrammarLessons.source_key == key))).scalar_one()
            lessons_by_key[idx] = lesson

        stories_by_idx = {}
        for idx in range(12):
            key = f'seed:C2:story:{idx}'
            story = (await db.execute(select(Stories).where(Stories.source_key == key))).scalar_one()
            stories_by_idx[idx] = story

        vocab_by_group = {}
        for group in [str(g) for g in range(1, 10)]:
            entries = (
                await db.execute(select(VocabEntries).where(VocabEntries.cefr_level == 'C2', VocabEntries.unit == group))
            ).scalars().all()
            vocab_by_group[group] = entries

        created_units = 0
        skipped_units = 0
        created_links = 0

        for idx, spec in enumerate(UNITS):
            source_key = f'seed:C2:unit:{idx}'
            existing = (
                await db.execute(select(CourseUnit).where(CourseUnit.unit_code == spec['unit_code'], CourseUnit.cefr_level == 'C2'))
            ).scalar_one_or_none()

            if existing is not None:
                skipped_units += 1
                continue

            lesson = lessons_by_key[idx]
            unit = CourseUnit(
                unit_code=spec['unit_code'],
                sequence_index=next_seq + idx,
                cefr_level='C2',
                source_unit_number=int(spec['group']),
                theme_title_en=spec['title_en'],
                theme_title_ru=spec['title_ru'],
                theme_title_tg=spec['title_tg'],
                grammar_topic_label=lesson.topic,
                grammar_lesson_id=lesson.id,
                estimated_minutes=35,
                is_level_midpoint=(idx == MIDPOINT_INDEX),
                is_level_final=(idx == FINAL_INDEX),
            )
            db.add(unit)
            await db.flush()
            created_units += 1

            story_idx = STORY_FOR_LESSON.get(idx)
            if story_idx is not None:
                story = stories_by_idx[story_idx]
                db.add(CourseUnitStories(course_unit_id=unit.id, story_id=story.id))
                created_links += 1

            group = spec['group']
            entries = vocab_by_group[group]
            half = len(entries) // 2
            is_first_of_pair = spec['unit_code'].endswith('A')
            group_entries = entries[:half] if is_first_of_pair else entries[half:]
            for entry in group_entries:
                db.add(CourseUnitVocab(course_unit_id=unit.id, vocab_entry_id=entry.id))
                created_links += 1

        await db.commit()
        print(f'units: created {created_units}, skipped {skipped_units}; links created {created_links}')


if __name__ == '__main__':
    asyncio.run(main())
