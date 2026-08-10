import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import VocabEntries

# (word, part_of_speech, example_en, translation_ru, translation_tg, unit_group)
WORDS = [
    ('ubiquitous', 'adjective', 'Smartphones have become ubiquitous in modern life.', 'вездесущий', 'ҳамаҷобуда', '1'),
    ('ostensibly', 'adverb', 'He resigned, ostensibly for health reasons.', 'якобы, по видимости', 'зоҳиран', '1'),
    ('unequivocal', 'adjective', 'She gave an unequivocal denial.', 'однозначный, недвусмысленный', 'бешубҳа', '1'),
    ('tenuous', 'adjective', 'The connection between the two events is tenuous at best.', 'шаткий, слабый', 'заиф', '1'),
    ('ephemeral', 'adjective', 'Fame in this industry is often ephemeral.', 'мимолётный, эфемерный', 'гузаро', '1'),
    ('myriad', 'adjective', 'There are a myriad of reasons for the delay.', 'множество, мириады', 'шумораи бешумор', '1'),
    ('plausible', 'adjective', "It's a plausible explanation, but we need more evidence.", 'правдоподобный', 'боварибахш', '1'),
    ('unprecedented', 'adjective', 'The company faced unprecedented losses this year.', 'беспрецедентный', 'бесобиқа', '1'),
    ('pervasive', 'adjective', 'Corruption was pervasive throughout the system.', 'вездесущий, распространённый', 'фарогир', '1'),
    ('inherent', 'adjective', 'There are inherent risks in any investment.', 'присущий, врождённый', 'хос', '1'),

    ('meticulous', 'adjective', "She's meticulous about every detail of her work.", 'дотошный, скрупулёзный', 'бодиққат', '2'),
    ('gregarious', 'adjective', "He's a gregarious person who loves parties.", 'общительный', 'ҷамъиятпараст', '2'),
    ('obstinate', 'adjective', "He remained obstinate despite everyone's advice.", 'упрямый', 'якрав', '2'),
    ('magnanimous', 'adjective', 'It was magnanimous of her to forgive him.', 'великодушный', 'саховатманд', '2'),
    ('reticent', 'adjective', 'He was reticent about his past.', 'сдержанный, немногословный', 'хомӯш', '2'),
    ('stoic', 'adjective', 'She remained stoic throughout the ordeal.', 'стоический, невозмутимый', 'собитқадам', '2'),
    ('candid', 'adjective', 'He gave a candid account of what happened.', 'откровенный, искренний', 'рӯирост', '2'),
    ('fastidious', 'adjective', "He's fastidious about how his desk is organised.", 'привередливый', 'бодиққат ва серталаб', '2'),
    ('wistful', 'adjective', 'She had a wistful look on her face.', 'тоскливый, задумчивый', 'ҳасратангез', '2'),
    ('eloquent', 'adjective', 'The speech was eloquent and moving.', 'красноречивый', 'нотиқ', '2'),

    ('substantiate', 'verb', 'The claims were never substantiated by evidence.', 'подтверждать, обосновывать', 'собит кардан', '3'),
    ('corroborate', 'verb', 'Two witnesses corroborated her story.', 'подтверждать (независимо)', 'тасдиқ кардан', '3'),
    ('delineate', 'verb', "The contract clearly delineates each party's responsibilities.", 'очерчивать, обозначать', 'муайян кардан', '3'),
    ('extrapolate', 'verb', 'We can extrapolate future trends from this data.', 'экстраполировать', 'бар асоси маълумот пешгӯӣ кардан', '3'),
    ('mitigate', 'verb', 'Measures were taken to mitigate the damage.', 'смягчать, уменьшать', 'сабук кардан', '3'),
    ('exacerbate', 'verb', 'The drought exacerbated the food shortage.', 'усугублять', 'бадтар кардан', '3'),
    ('scrutinize', 'verb', 'The accounts were scrutinized by auditors.', 'тщательно изучать', 'бодиққат баррасӣ кардан', '3'),
    ('discern', 'verb', 'It was hard to discern any pattern in the data.', 'различать, распознавать', 'фарқ кардан', '3'),
    ('underscore', 'verb', 'The report underscores the need for reform.', 'подчёркивать (важность)', 'таъкид кардан', '3'),
    ('reconcile', 'verb', "It's hard to reconcile these two conflicting accounts.", 'примирять, согласовывать', 'мувофиқ кардан', '3'),

    ('a far cry from', 'phrase', 'This result is a far cry from what we expected.', 'совсем не то же самое, что', 'комилан фарқ доштан аз', '4'),
    ('read between the lines', 'phrase', 'You have to read between the lines to understand his real intentions.', 'читать между строк', 'байни сатрҳоро хондан', '4'),
    ('the tip of the iceberg', 'phrase', 'These complaints are just the tip of the iceberg.', 'верхушка айсберга', 'нӯги кӯҳи ях', '4'),
    ('par for the course', 'phrase', 'Delays like this are par for the course in construction.', 'обычное дело, как обычно', 'чизи муқаррарӣ', '4'),
    ('a blessing in disguise', 'phrase', 'Losing that job turned out to be a blessing in disguise.', 'скрытое благо', 'неъмати пинҳонӣ', '4'),
    ('get the ball rolling', 'phrase', "Let's get the ball rolling on this project.", 'начать дело, сдвинуть с места', 'корро оғоз кардан', '4'),
    ('cut corners', 'phrase', 'They cut corners on safety to save money.', 'экономить в ущерб качеству', 'сифатро барои сарфа паст кардан', '4'),
    ('a double-edged sword', 'phrase', 'Social media is a double-edged sword.', 'палка о двух концах', 'шамшери дудама', '4'),
    ('the elephant in the room', 'phrase', 'Nobody wanted to mention the elephant in the room.', 'слон в комнате (очевидная проблема, которую все избегают)', 'масъалаи возеҳе, ки нодида мегиранд', '4'),
    ('sit on the fence', 'phrase', 'He always sits on the fence instead of taking a side.', 'занимать нейтральную позицию', 'бетараф мондан', '4'),

    ('nebulous', 'adjective', 'His plans for the future remain nebulous.', 'смутный, расплывчатый', 'норавшан', '5'),
    ('palpable', 'adjective', 'There was a palpable sense of relief in the room.', 'осязаемый, явный', 'ҳискардашаванда', '5'),
    ('tacit', 'adjective', 'They reached a tacit agreement not to discuss it.', 'молчаливый, подразумеваемый', 'зимнӣ', '5'),
    ('vehement', 'adjective', 'She gave a vehement denial of the accusations.', 'яростный, страстный', 'шадид', '5'),
    ('enigmatic', 'adjective', 'He remained an enigmatic figure throughout his career.', 'загадочный', 'муаммогин', '5'),
    ('lucid', 'adjective', 'Her explanation was remarkably lucid.', 'ясный, понятный', 'равшан', '5'),
    ('deferential', 'adjective', 'He spoke in a deferential tone to his superiors.', 'почтительный', 'эҳтиромкор', '5'),
    ('coerce', 'verb', 'She was coerced into signing the agreement.', 'принуждать', 'маҷбур кардан', '5'),
    ('disparage', 'verb', "He tends to disparage other people's achievements.", 'принижать, критиковать', 'паст задан', '5'),
    ('assuage', 'verb', 'Nothing could assuage her guilt.', 'успокаивать, смягчать', 'ором кардан', '5'),

    ('capitulate', 'verb', "The company finally capitulated to the union's demands.", 'капитулировать, сдаваться', 'таслим шудан', '6'),
    ('circumvent', 'verb', 'They found a way to circumvent the regulations.', 'обходить (правило)', 'гурехтан аз', '6'),
    ('conflate', 'verb', "It's a mistake to conflate correlation with causation.", 'смешивать, путать (понятия)', 'омехтан', '6'),
    ('disseminate', 'verb', 'The findings were disseminated widely in the press.', 'распространять (информацию)', 'паҳн кардан', '6'),
    ('elicit', 'verb', 'The question elicited a strong reaction from the audience.', 'вызывать (реакцию), добиваться', 'ба даст овардан', '6'),
    ('expedite', 'verb', 'We need to expedite the approval process.', 'ускорять', 'тезонидан', '6'),
    ('galvanize', 'verb', 'The speech galvanized the crowd into action.', 'побуждать, воодушевлять', 'бармеангезонд', '6'),
    ('hinder', 'verb', 'Poor weather hindered the rescue efforts.', 'препятствовать', 'монеъ шудан', '6'),
    ('inculcate', 'verb', 'Parents try to inculcate good values in their children.', 'прививать (ценности)', 'ҷо кардан (арзишҳо)', '6'),
    ('obviate', 'verb', 'The new policy obviates the need for manual approval.', 'устранять необходимость', 'бартараф кардан (эҳтиёҷ)', '6'),

    ('be at a loss for words', 'phrase', 'I was at a loss for words when I heard the news.', 'лишиться дара речи', 'гуфтанро надонистан', '7'),
    ('once in a blue moon', 'phrase', 'We only see each other once in a blue moon.', 'очень редко', 'хеле кам', '7'),
    ('jump on the bandwagon', 'phrase', 'Many companies jumped on the bandwagon once the trend took off.', 'присоединиться к модной тенденции', 'ба мавҷи маъмул ҳамроҳ шудан', '7'),
    ('go the extra mile', 'phrase', 'She always goes the extra mile for her clients.', 'прилагать дополнительные усилия', 'кӯшиши иловагӣ кардан', '7'),
    ('throw in the towel', 'phrase', 'After three failed attempts, he threw in the towel.', 'сдаться', 'таслим шудан', '7'),
    ('a slippery slope', 'phrase', 'Allowing one exception is a slippery slope.', 'скользкий путь (к плохим последствиям)', 'роҳи хатарнок', '7'),
    ('add fuel to the fire', 'phrase', 'His comment only added fuel to the fire.', 'подливать масла в огонь', 'оташро тезтар кардан', '7'),
    ('take something with a pinch of salt', 'phrase', 'You should take his promises with a pinch of salt.', 'относиться со скепсисом', 'бо шубҳа қабул кардан', '7'),
    ('come to terms with', 'phrase', 'It took her years to come to terms with the loss.', 'смириться с чем-то', 'бо чизе созиш кардан', '7'),
    ('hit the nail on the head', 'phrase', "You've hit the nail on the head with that observation.", 'попасть в точку', 'ба нуқтаи асосӣ расидан', '7'),

    ('predicament', 'noun', 'He found himself in a difficult predicament.', 'затруднительное положение', 'вазъияти душвор', '8'),
    ('conundrum', 'noun', 'Solving the housing crisis remains a conundrum for policymakers.', 'головоломка, сложная задача', 'муаммои мушкил', '8'),
    ('quandary', 'noun', 'She was in a quandary about which job offer to accept.', 'затруднение, дилемма', 'дудилагӣ', '8'),
    ('resilience', 'noun', 'The community showed great resilience after the flood.', 'устойчивость, стойкость', 'тобоварӣ', '8'),
    ('nuance', 'noun', 'The translation lost some of the nuance of the original.', 'нюанс, тонкость', 'нозукӣ', '8'),
    ('discrepancy', 'noun', "There's a discrepancy between the two reports.", 'расхождение, несоответствие', 'номувофиқат', '8'),
    ('ramification', 'noun', 'The decision had far-reaching ramifications.', 'последствие', 'оқибат', '8'),
    ('prerequisite', 'noun', 'Trust is a prerequisite for any good relationship.', 'предпосылка, необходимое условие', 'шарти зарурӣ', '8'),
    ('dichotomy', 'noun', "There's a false dichotomy between quality and speed.", 'дихотомия, противопоставление', 'муқобилгузорӣ', '8'),
    ('paradigm', 'noun', 'The discovery represented a paradigm shift in physics.', 'парадигма, модель', 'намуна', '8'),

    ('arguably', 'adverb', 'This is arguably her best work to date.', 'можно утверждать, что', 'метавон гуфт, ки', '9'),
    ('invariably', 'adverb', 'He invariably arrives ten minutes late.', 'неизменно, всегда', 'ҳамеша', '9'),
    ('inadvertently', 'adverb', 'She inadvertently deleted the file.', 'непреднамеренно', 'бе қасд', '9'),
    ('unwittingly', 'adverb', 'He unwittingly became part of the scandal.', 'невольно, не осознавая', 'бехабар', '9'),
    ('notwithstanding', 'adverb', 'The plan went ahead, criticism notwithstanding.', 'несмотря на', 'сарфи назар аз', '9'),
    ('albeit', 'adverb', 'It was a good performance, albeit a little too long.', 'хотя, хоть и', 'гарчанде', '9'),
    ('henceforth', 'adverb', 'Henceforth, all reports must be submitted by Friday.', 'отныне, впредь', 'минбаъд', '9'),
    ('nonetheless', 'adverb', 'It was risky; nonetheless, she went ahead with the plan.', 'тем не менее', 'бо вуҷуди ин', '9'),
    ('conversely', 'adverb', 'Prices rose; conversely, demand fell sharply.', 'наоборот, напротив', 'баръакс', '9'),
    ('unbeknownst to', 'phrase', 'Unbeknownst to her, the meeting had been cancelled.', 'без чьего-либо ведома', 'бехабар аз касе', '9'),
]


async def seed_vocab(db):
    created = 0
    skipped = 0

    for idx, (word, pos, example_en, ru, tg, unit) in enumerate(WORDS):
        source_key = f'seed:C2:vocab:{idx}'
        existing = (
            await db.execute(select(VocabEntries).where(VocabEntries.source_key == source_key))
        ).scalar_one_or_none()

        if existing is not None:
            skipped += 1
            continue

        db.add(VocabEntries(
            word=word,
            part_of_speech=pos,
            example_en=example_en,
            translation_ru=ru,
            translation_tg=tg,
            cefr_level='C2',
            unit=unit,
            source_key=source_key,
        ))
        created += 1

    return created, skipped


async def main():
    async with AsyncSessionLocal() as db:
        created, skipped = await seed_vocab(db)
        await db.commit()
        print(f'vocab entries: created {created}, skipped {skipped} (already seeded)')


if __name__ == '__main__':
    asyncio.run(main())
