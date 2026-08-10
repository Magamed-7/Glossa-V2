import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import GrammarExamples, GrammarLessons, GrammarQuestions

FIXES = {
    'seed:A1:grammar:missing:have_got_/_has_got': {
        'rule_en': "Use 'have got' / 'has got' to talk about possession, family, and things people have. It means the same as 'have', but is more common in spoken British English. Use have/has + got + noun.",
        'rule_ru': "Используй 'have got' / 'has got', чтобы говорить об обладании, семье и вещах, которые есть у людей. Это означает то же самое, что и 'have', но чаще используется в разговорном британском английском.",
        'rule_tg': "'Have got' / 'has got'-ро барои гуфтан дар бораи молу мулк, оила ва чизҳое, ки одамон доранд, истифода баред. Ин маънои 'have'-ро дорад, вале дар забони гуфтугӯии бритониёӣ бештар истифода мешавад.",
        'structure': "I/you/we/they + have got; he/she/it + has got; negative: haven't/hasn't got; question: Have/Has + subject + got?",
        'tip': "'Have got' is usually contracted in speech: I've got, she's got, haven't got.",
        'examples': [
            "I've got two brothers and a sister.",
            "She's got a new phone.",
            "We haven't got any milk.",
            "Have you got a pen I could borrow?",
        ],
        'questions': [
            ("Choose the correct form: She ___ a car.", ['has got', 'have got', 'haves got'], 'has got',
             "With he/she/it, the correct form is 'has got', not 'have got'."),
            ("Choose the correct negative: They ___ any children.", ["haven't got", "hasn't got", "not got"], "haven't got",
             "With 'they', the negative is 'haven't got'."),
            ("Choose the correct question: ___ you got a dog?", ['Have', 'Has', 'Do'], 'Have',
             "Questions with 'have got' use 'Have/Has' at the start, not 'do/does'."),
            ("Complete: I ___ got a new laptop.", ["'ve", 'has', 'is'], "'ve",
             "'I've got' is the contraction of 'I have got'."),
            ("Which sentence means the same as 'She has a sister.'?", ["She's got a sister.", 'She has got sister.', 'She have got a sister.'],
             "She's got a sister.",
             "'Have got' is an alternative way of expressing possession, with the same meaning as 'have'."),
        ],
    },
    'seed:C1:grammar:missing:nominalisation': {
        'rule_en': "Nominalisation turns a verb or adjective into a noun (arrive → arrival, decide → decision, popular → popularity). It is common in essays, reports and news writing, where it lets you describe an action or quality as a 'thing' instead of repeating a full clause with a subject and verb.",
        'rule_ru': "Номинализация превращает глагол или прилагательное в существительное (arrive → arrival, decide → decision, popular → popularity). Это распространено в эссе, отчётах и новостях, где позволяет описать действие или качество как 'вещь', не повторяя полное придаточное с подлежащим и сказуемым.",
        'rule_tg': "Номинализатсия феъл ё сифатро ба исм табдил медиҳад (arrive → arrival, decide → decision, popular → popularity). Ин дар иншо, ҳисобот ва хабарҳо маъмул аст, ки амал ё сифатро ҳамчун 'чиз' тасвир мекунад, на такрори ҷумлаи пурра.",
        'structure': "verb/adjective + suffix (-tion, -ment, -al, -ity, -ance) → noun",
        'tip': "Watch for irregular nominalisations: 'decide' → 'decision' (not 'decidement'), 'succeed' → 'success' (not 'succeedment').",
        'examples': [
            "The company announced its decision to expand. (decide → decision)",
            "Her arrival caused great excitement. (arrive → arrival)",
            "The popularity of the product surprised everyone. (popular → popularity)",
            "His performance improved significantly. (perform → performance)",
        ],
        'questions': [
            ("Choose the correct noun form of 'succeed'.", ['success', 'succeedment', 'succession'], 'success',
             "'Succeed' → 'success' is the correct, irregular nominalised form."),
            ("Choose the correct noun form of 'arrive'.", ['arrival', 'arrivement', 'arriving'], 'arrival',
             "'Arrive' → 'arrival' is the correct nominalised form."),
            ("Rewrite 'The team performed well' using nominalisation.",
             ["The team's performance was good.", 'The team performment was good.', 'The performing of the team was good.'],
             "The team's performance was good.",
             "'Performed' becomes the noun 'performance', with 'the team's' as possessive."),
            ("Choose the noun form of 'popular'.", ['popularity', 'popularness', 'popularation'], 'popularity',
             "'Popular' → 'popularity' is the correct nominalised form."),
            ("Which sentence uses nominalisation?", ['Her decision surprised us.', 'She decided to surprise us.', 'She was deciding to surprise us.'],
             'Her decision surprised us.',
             "'Decision' is the noun form of 'decide', used here instead of a verb clause."),
        ],
    },
    'seed:C1:grammar:missing:participle_clauses': {
        'rule_en': "Participle clauses (using -ing or -ed/-en forms) replace a relative clause or a clause with a conjunction, making sentences shorter and more fluent. Present participles (-ing) usually have an active meaning; past participles (-ed/-en) usually have a passive meaning.",
        'rule_ru': "Причастные обороты (с формами на -ing или -ed/-en) заменяют относительное придаточное или придаточное с союзом, делая предложения короче и более естественными. Причастие настоящего времени (-ing) обычно имеет активное значение; причастие прошедшего времени (-ed/-en) обычно имеет пассивное значение.",
        'rule_tg': "Иборахои сифати феълӣ (бо шаклҳои -ing ё -ed/-en) ҷумлаи нисбӣ ё ҷумлаи пайвасткунандаро иваз мекунанд, ҷумларо кӯтоҳтар мекунанд. Сифати феълии замони ҳозира (-ing) маънои фоилӣ дорад; сифати феълии замони гузашта (-ed/-en) маънои мафъулӣ дорад.",
        'structure': "-ing clause (active): Verb+ing..., main clause. | -ed clause (passive): Verb+ed/en..., main clause.",
        'tip': "The subject of the participle clause must be the same as the subject of the main clause, or the sentence becomes a 'dangling modifier' and sounds wrong.",
        'examples': [
            "Feeling tired, she went to bed early.",
            "Written in 1920, the novel is still popular today.",
            "Not knowing the answer, he stayed silent.",
            "Encouraged by the results, the team kept working.",
        ],
        'questions': [
            ("Choose the correct participle clause for 'Because he was exhausted, he sat down.'",
             ['Exhausted, he sat down.', 'Exhausting, he sat down.', 'Exhaust, he sat down.'], 'Exhausted, he sat down.',
             "A past participle ('exhausted') gives a passive/state meaning here — he was made exhausted."),
            ("Choose the correct form: ___ the news, she called her family immediately.",
             ['Hearing', 'Heard', 'Hear'], 'Hearing',
             "The present participle 'hearing' shows an active action she performed."),
            ("Which sentence has a dangling (wrongly attached) participle clause?",
             ['Walking to the station, the rain started.', 'Walking to the station, I got caught in the rain.', 'While walking to the station, I got caught in the rain.'],
             'Walking to the station, the rain started.',
             "The rain wasn't walking to the station — the subject of the main clause doesn't match the participle's implied subject."),
            ("Choose the correct past-participle clause: ___ by the committee, the proposal was sent for approval.",
             ['Approved', 'Approving', 'Approve'], 'Approved',
             "'Approved' (past participle) gives a passive meaning: the proposal was approved."),
            ("Rewrite 'Because she didn't know what to say, she stayed quiet' as a participle clause.",
             ['Not knowing what to say, she stayed quiet.', 'Not know what to say, she stayed quiet.', 'Knowing not what to say, she stayed quiet.'],
             'Not knowing what to say, she stayed quiet.',
             "Negative participle clauses put 'not' directly before the -ing form."),
        ],
    },
    'seed:C1:grammar:missing:emphasis_with_cleft_sentences': {
        'rule_en': "A cleft sentence divides one idea into two clauses to put special emphasis on one part of the information: 'It + be + the emphasised part + that/who + the rest of the sentence.'",
        'rule_ru': "Cleft-предложение делит одну мысль на два предложения, чтобы поставить особый акцент на одной части информации: 'It + be + выделяемая часть + that/who + остальное предложение'.",
        'rule_tg': "Ҷумлаи cleft як фикрро ба ду ҷумла тақсим мекунад, то таъкиди махсусро ба як қисми иттилоот гузорад: 'It + be + қисми таъкидшуда + that/who + боқимонда'.",
        'structure': "It + be + focus + that/who + clause",
        'tip': "Only the focused part changes — the rest of the information stays exactly the same as in the plain sentence.",
        'examples': [
            "Tom broke the window. → It was Tom who broke the window.",
            "I met her at the conference. → It was at the conference that I met her.",
            "We need more time, not more money. → It's more time that we need, not more money.",
            "She solved the problem quickly. → It was quickly that she solved the problem.",
        ],
        'questions': [
            ("Choose the cleft sentence focusing on 'yesterday' in 'I called you yesterday.'",
             ['It was yesterday that I called you.', 'It was yesterday I called you that.', 'Yesterday it was that I called you.'],
             'It was yesterday that I called you.',
             "The focused element ('yesterday') follows 'It was', then 'that' introduces the rest of the clause."),
            ("Choose the cleft sentence focusing on 'Anna' in 'Anna wrote the report.'",
             ['It was Anna who wrote the report.', 'It was Anna wrote the report.', 'Anna, it was who wrote the report.'],
             'It was Anna who wrote the report.',
             "A cleft focusing on a person needs 'who' (or 'that') after the focused name."),
            ("What changes in a cleft sentence compared to the plain sentence?",
             ['only the focus and sentence structure, not the core information', 'the meaning changes completely', 'the tense always changes'],
             'only the focus and sentence structure, not the core information',
             "Cleft sentences reorganize emphasis, not meaning — the underlying facts stay the same."),
            ("Choose the correct relative word: It was the manager ___ approved the request.",
             ['who', 'which', 'whom'], 'who',
             "'Who' is used for a person (the manager) as the focused subject of the cleft."),
            ("Which of these is NOT a cleft sentence?",
             ['She left because she was upset.', 'It was because she was upset that she left.', 'It was her that left because she was upset.'],
             'She left because she was upset.',
             "This is a plain sentence with no 'It + be + focus' structure — the other two are cleft versions of it."),
        ],
    },
    'seed:C1:grammar:missing:complex_inversion': {
        'rule_en': "In formal and literary English, certain negative or limiting adverbials (never, rarely, seldom, not only, hardly) can be moved to the front of a clause for emphasis. When this happens, the subject and auxiliary verb swap places, just like in a question.",
        'rule_ru': "В формальном и литературном английском некоторые отрицательные или ограничительные наречия (never, rarely, seldom, not only, hardly) могут выноситься в начало предложения для эмфазы. При этом подлежащее и вспомогательный глагол меняются местами, как в вопросе.",
        'rule_tg': "Дар забони расмӣ ва адабӣ баъзе зарфҳои манфӣ (never, rarely, seldom, not only, hardly) метавонанд барои таъкид ба аввали ҷумла бароварда шаванд. Дар ин ҳолат мубтадо ва феъли ёридиҳанда ҷойивазкунӣ мекунанд, мисли савол.",
        'structure': "Negative adverbial + auxiliary + subject + verb",
        'tip': "If there's no auxiliary in the original sentence, add 'do/does/did': 'I rarely see him' → 'Rarely do I see him.'",
        'examples': [
            "I have never seen such a mess. → Never have I seen such a mess.",
            "She rarely complains. → Rarely does she complain.",
            "He had hardly sat down when the phone rang. → Hardly had he sat down when the phone rang.",
            "We not only won the game, but also broke the record. → Not only did we win the game, but we also broke the record.",
        ],
        'questions': [
            ("Choose the correct inversion of 'I have rarely felt so proud.'",
             ['Rarely have I felt so proud.', 'Rarely I have felt so proud.', 'Rarely did I felt so proud.'],
             'Rarely have I felt so proud.',
             "The existing auxiliary 'have' moves before the subject 'I'."),
            ("Choose the correct inversion of 'She seldom asks for help.'",
             ['Seldom does she ask for help.', 'Seldom she asks for help.', 'Seldom asks she for help.'],
             'Seldom does she ask for help.',
             "With no existing auxiliary, 'does' is inserted before the subject, and the verb returns to base form."),
            ("Complete: Not only ___ late, but he also forgot his keys.",
             ['was he', 'he was', 'he is'], 'was he',
             "'Not only' fronted triggers inversion: 'was he', not 'he was'."),
            ("Which auxiliary is needed to invert 'He hardly said a word' (no existing auxiliary)?",
             ['did', 'has', 'was'], 'did',
             "Past simple with no auxiliary needs 'did' inserted for the inversion, with the verb in base form."),
            ("Choose the correctly inverted sentence for 'We had hardly started when it began to rain.'",
             ['Hardly had we started when it began to rain.', 'Hardly we had started when it began to rain.', 'Hardly did we start when it began to rain.'],
             'Hardly had we started when it began to rain.',
             "The existing auxiliary 'had' moves before the subject 'we'."),
        ],
    },
}


async def main():
    async with AsyncSessionLocal() as db:
        updated = 0
        for source_key, data in FIXES.items():
            lesson = (
                await db.execute(select(GrammarLessons).where(GrammarLessons.source_key == source_key))
            ).scalar_one_or_none()

            if lesson is None:
                print(f'NOT FOUND: {source_key}')
                continue

            lesson.rule_en = data['rule_en']
            lesson.rule_ru = data['rule_ru']
            lesson.rule_tg = data['rule_tg']
            lesson.structure = data['structure']
            lesson.tip = data['tip']

            await db.execute(GrammarExamples.__table__.delete().where(GrammarExamples.lesson_id == lesson.id))
            await db.execute(GrammarQuestions.__table__.delete().where(GrammarQuestions.lesson_id == lesson.id))

            for order, text in enumerate(data['examples']):
                db.add(GrammarExamples(lesson_id=lesson.id, text=text, order=order))

            for text_en, options, answer, explanation_en in data['questions']:
                db.add(GrammarQuestions(
                    lesson_id=lesson.id,
                    type='multiple_choice',
                    text_en=text_en,
                    options=options,
                    answer=answer,
                    explanation_en=explanation_en,
                ))

            updated += 1

        await db.commit()
        print(f'updated {updated} / {len(FIXES)} placeholder lessons with real content')


asyncio.run(main())
