import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories, StoryQuestions, StoryWords

STORIES = [
    {
        'title_en': 'The Weight of What Remained', 'title_ru': 'Тяжесть того, что осталось', 'title_tg': 'Вазни он чи монд',
        'genre': 'literary', 'grammar_topic': 'nominalisation for academic and formal tone',
        'body_en': (
            'This she kept: his reading glasses, still folded on the nightstand. His decision, '
            'all those years ago, to plant the oak tree in the garden — a decision she had once '
            'thought impulsive, now understood as the most patient thing he ever did. That she '
            'should be the one to outlive him had never once occurred to either of them.\n\n'
            'It was the small things, in the end, that proved hardest to release. Not the wedding '
            "photographs, which she could look at calmly now. Not even his handwriting, which she "
            'found everywhere, in margins and shopping lists. It was the ordinary residue of a '
            'life — a coffee mug with a chip in the handle, a coat that still, absurdly, smelled '
            'of him.\n\n'
            'Grief, she had learned, was not a single wave but an accumulation: small losses, '
            'nominalised into one enormous word, arriving separately, on their own schedule, '
            'whenever they pleased.'
        ),
        'body_ru': (
            'Вот что она сохранила: его очки для чтения, всё ещё сложенные на тумбочке. Его решение много лет назад посадить дуб в саду — решение, которое она когда-то считала импульсивным, а теперь понимала как самый терпеливый поступок, который он когда-либо совершил. То, что именно ей суждено пережить его, ни разу не приходило в голову ни одному из них.\n\n'
            'В конце концов, труднее всего оказалось отпустить именно мелочи. Не свадебные фотографии — на них она теперь могла смотреть спокойно. Даже не его почерк, который она находила повсюду — на полях книг, в списках покупок. Труднее всего был обычный осадок жизни — кружка для кофе со сколотой ручкой, пальто, которое до сих пор, нелепо, пахло им.\n\n'
            'Горе, как она поняла, было не одной волной, а накоплением: маленькие потери, слитые в одно огромное слово, приходящие по отдельности, по собственному расписанию, когда им вздумается.'
        ),
        'body_tg': (
            'Ин чизҳоро вай нигоҳ дошт: айнаки хониши ӯ, ки то ҳол дар болои мизчаи хоб буд. Қарори ӯ, солҳо пеш, дар бораи шинондани дарахти булут дар боғ — қароре, ки вай замоне онро беандешона мешумурд, ҳоло бошад, онро сабртарин коре, ки ӯ ҳаргиз кардааст, мефаҳмид. Ин ки маҳз вай бояд аз ӯ дертар зинда монад, ҳаргиз ба хаёли ҳарду нарасида буд.\n\n'
            'Дар ниҳоят, маҳз чизҳои хурд аз ҳама душвортар барои раҳо кардан буданд. На акси тӯй — ба онҳо вай ҳоло метавонист бо оромӣ нигоҳ кунад. Ҳатто на хати дасти ӯ, ки вай дар ҳама ҷо — дар канори китобҳо, дар рӯйхати харид — меёфт. Душвортарин чиз боқимондаи муқаррарии як зиндагӣ буд — пиёлаи қаҳва бо дастаи шикаста, палтое ки то ҳол, бемаънӣ, бӯи ӯро медод.\n\n'
            'Ғам, чунон ки вай фаҳмид, як мавҷ набуд, балки ҷамъшавӣ буд: талафоти хурд, ки ба як калимаи азим бадал мешуданд, алоҳида-алоҳида, тибқи ҷадвали худ, ҳар вақте ки мехостанд, меомаданд.'
        ),
        'word_dictionary': {
            'nightstand': {'ru': 'тумбочка', 'tg': 'мизчаи хоб', 'lemma': 'nightstand'},
            'impulsive': {'ru': 'импульсивный', 'tg': 'беандешона', 'lemma': 'impulsive'},
            'outlive': {'ru': 'пережить (кого-то)', 'tg': 'аз касе дертар зинда мондан', 'lemma': 'outlive'},
            'residue': {'ru': 'осадок, остаток', 'tg': 'боқимонда', 'lemma': 'residue'},
            'grief': {'ru': 'горе', 'tg': 'ғам', 'lemma': 'grief'},
            'accumulation': {'ru': 'накопление', 'tg': 'ҷамъшавӣ', 'lemma': 'accumulation'},
        },
        'story_words': [
            ('impulsive', 'adjective', 'impulsive'), ('outlive', 'verb', 'outlive'),
            ('residue', 'noun', 'residue'), ('grief', 'noun', 'grief'), ('accumulation', 'noun', 'accumulation'),
        ],
        'questions': [
            ('How did she come to understand his decision to plant the oak tree?',
             'Как она стала понимать его решение посадить дуб?',
             'Вай қарори ӯро дар бораи шинондани дарахти булут чӣ тавр фаҳмид?',
             ['As the most patient thing he ever did', 'As a waste of time', 'As a decision she made herself'],
             'As the most patient thing he ever did',
             'She now understands it as the most patient thing he ever did, not an impulsive act.',
             'Теперь она понимает это как самый терпеливый поступок, который он совершил, а не импульсивный.',
             'Ҳоло вай онро ҳамчун сабртарин коре, ки ӯ кардааст, мефаҳмад, на амали беандеша.'),
            ('What did she find hardest to let go of?',
             'Что ей было труднее всего отпустить?',
             'Раҳо карданти чӣ барои вай душвортарин буд?',
             ['Small, ordinary objects like a chipped mug and his coat', 'The wedding photographs', 'His handwriting'],
             'Small, ordinary objects like a chipped mug and his coat',
             'The ordinary residue of life — a chipped mug, a coat that still smelled of him — proved hardest.',
             'Обычный осадок жизни — сколотая кружка, пальто, всё ещё пахнущее им — оказался труднее всего.',
             'Боқимондаи муқаррарии зиндагӣ — пиёлаи шикаста, палтои бӯи ӯро дошта — душвортарин буд.'),
            ('How does she describe grief by the end of the story?',
             'Как она описывает горе к концу истории?',
             'Вай дар охири ҳикоя ғамро чӣ тавр тасвир мекунад?',
             ['As an accumulation of small losses arriving separately', 'As a single overwhelming wave', 'As something that ends quickly'],
             'As an accumulation of small losses arriving separately',
             'She learned grief was not a single wave but an accumulation of small losses.',
             'Она поняла, что горе — не одна волна, а накопление маленьких потерь.',
             'Вай фаҳмид, ки ғам як мавҷ нест, балки ҷамъшавии талафоти хурд аст.'),
        ],
    },
    {
        'title_en': 'If Only, If Only', 'title_ru': 'Если бы, если бы', 'title_tg': 'Кошки, кошки',
        'genre': 'drama', 'grammar_topic': 'mixed and layered conditionals',
        'body_en': (
            "If I hadn't taken that job in the north, I would be with my family right now, "
            "instead of alone in a rented flat, listening to a language I still don't fully "
            "understand.\n\n"
            "If I weren't so stubborn, I would have admitted months ago that I made a mistake. "
            "But I am stubborn, and so I stayed, telling myself things would improve if I just "
            "gave it more time.\n\n"
            "If she hadn't called me last week, I don't know if I would have realised how much "
            "I'd missed home. If I had realised sooner, I might have already booked the flight "
            "back.\n\n"
            "Sometimes I wonder: if I went home now, would it feel like defeat, or would it "
            "simply feel like coming to my senses? If I hadn't been so afraid of admitting "
            "failure, I would probably already know the answer."
        ),
        'body_ru': (
            'Не возьми я ту работу на севере, я был бы сейчас с семьёй, а не один в съёмной квартире, слушая язык, который до сих пор не до конца понимаю.\n\n'
            'Не будь я таким упрямым, я бы уже месяцы назад признал, что совершил ошибку. Но я упрям, и потому остался, убеждая себя, что всё наладится, если просто дать этому больше времени.\n\n'
            'Не позвони она мне на прошлой неделе, не знаю, понял бы я, как сильно скучаю по дому. Пойми я это раньше, я, возможно, уже забронировал бы билет обратно.\n\n'
            'Иногда я думаю: вернись я домой сейчас, было бы это похоже на поражение, или это было бы просто похоже на то, что я наконец опомнился? Не боюсь я так признавать поражение, я, вероятно, уже знал бы ответ.'
        ),
        'body_tg': (
            'Агар он корро дар шимол намегирифтам, ҳоло бо оилаам мебудам, на танҳо дар хонаи иҷоравӣ, гӯш карда истода ба забоне, ки то ҳол пурра намефаҳмам.\n\n'
            'Агар ин қадар якрав намебудам, моҳҳо пеш эътироф мекардам, ки хато кардаам. Аммо ман якрав ҳастам, ва бинобар ин мондам, худамро бовар кунонда, ки агар вақти бештар диҳам, ҳама чиз беҳтар мешавад.\n\n'
            'Агар вай ҳафтаи гузашта ба ман занг намезад, намедонам, оё мефаҳмидам, ки то чӣ андоза хонаро пазмон шудаам. Агар инро зудтар мефаҳмидам, шояд аллакай чиптаи бозгаштро харида будам.\n\n'
            'Баъзан фикр мекунам: агар ҳоло ба хона бармегаштам, оё ин мисли шикаст ҳис мешуд, ё танҳо мисли ба ҳуш омадан? Агар аз эътирофи шикаст ин қадар наметарсидам, эҳтимол ҷавобро аллакай медонистам.'
        ),
        'word_dictionary': {
            'stubborn': {'ru': 'упрямый', 'tg': 'якрав', 'lemma': 'stubborn'},
            'realise': {'ru': 'осознавать', 'tg': 'фаҳмидан', 'lemma': 'realise'},
            'defeat': {'ru': 'поражение', 'tg': 'шикаст', 'lemma': 'defeat'},
            'come to my senses': {'ru': 'опомниться', 'tg': 'ба ҳуш омадан', 'lemma': 'come to senses'},
            'admit': {'ru': 'признавать', 'tg': 'эътироф кардан', 'lemma': 'admit'},
        },
        'story_words': [
            ('stubborn', 'adjective', 'stubborn'), ('realise', 'verb', 'realise'),
            ('defeat', 'noun', 'defeat'), ('admit', 'verb', 'admit'),
        ],
        'questions': [
            ('Where is the narrator currently living?',
             'Где сейчас живёт рассказчик?',
             'Ровӣ ҳоло дар куҷо зиндагӣ мекунад?',
             ['Alone in a rented flat in the north', 'With family back home', "In a friend's house"],
             'Alone in a rented flat in the north',
             'The narrator lives alone in a rented flat, having taken a job in the north.',
             'Рассказчик живёт один в съёмной квартире, взяв работу на севере.',
             'Ровӣ пас аз гирифтани кор дар шимол, танҳо дар хонаи иҷоравӣ зиндагӣ мекунад.'),
            ('What made the narrator realise how much they missed home?',
             'Что заставило рассказчика осознать, как сильно он скучает по дому?',
             'Ба ровӣ чӣ кӯмак кард, ки бифаҳмад, то чӣ андоза хонаро пазмон шудааст?',
             ['A phone call from her last week', 'A letter from his family', 'A dream'],
             'A phone call from her last week',
             'If she hadn\'t called him last week, he might not have realised how much he\'d missed home.',
             'Если бы она не позвонила ему на прошлой неделе, он мог бы не осознать, как скучает по дому.',
             'Агар вай ҳафтаи гузашта занг намезад, шояд ӯ намефаҳмид, ки то чӣ андоза хонаро пазмон шудааст.'),
            ('What does the narrator say prevents them from knowing the answer?',
             'Что, по словам рассказчика, мешает ему узнать ответ?',
             'Ровӣ мегӯяд, ки ба донистани ҷавоб чӣ монеъ мешавад?',
             ['Being afraid of admitting failure', 'Not having enough money', 'Not knowing the language'],
             'Being afraid of admitting failure',
             "He says if he weren't so afraid of admitting failure, he'd probably already know the answer.",
             'Он говорит, что если бы не так боялся признать поражение, вероятно, уже знал бы ответ.',
             'Ӯ мегӯяд, ки агар аз эътирофи шикаст ин қадар наметарсид, эҳтимол ҷавобро аллакай медонист.'),
        ],
    },
    {
        'title_en': 'The Man with the Telescope', 'title_ru': 'Мужчина с телескопом', 'title_tg': 'Марди бо телескоп',
        'genre': 'comedy', 'grammar_topic': 'structural ambiguity and disambiguation',
        'body_en': (
            'Detective Rowe read the witness statement aloud a third time. "I saw the man with a '
            'telescope." He frowned. "Did you mean you used the telescope to see him? Or that '
            'the man himself was holding one?"\n\n'
            'The witness, an elderly astronomer, looked mildly offended. "Does it matter?"\n\n'
            '"It matters enormously," said Rowe. "If you saw him through a telescope, you could '
            "have been half a mile away, and he wouldn't have known you were watching. If he was "
            'holding the telescope, you were close enough to see it clearly — which makes you a '
            'witness to whatever he was doing with it."\n\n'
            'The astronomer considered this. "In that case, I suppose I mean both. I was using '
            'my telescope. And, through it, I saw that he was holding one too, pointed at my '
            'house."\n\n'
            'Rowe put down his pen. "So he was watching you, watching him, through telescopes, '
            'at the exact same moment?"\n\n'
            '"Astronomy," the old man said solemnly, "is a small world."'
        ),
        'body_ru': (
            'Детектив Роу в третий раз зачитал показания свидетеля вслух. «Я видел мужчину с телескопом». Он нахмурился. «Вы имели в виду, что использовали телескоп, чтобы увидеть его? Или что сам мужчина держал телескоп?»\n\n'
            'Свидетель, пожилой астроном, выглядел слегка оскорблённым. «Разве это важно?»\n\n'
            '«Это чрезвычайно важно, — сказал Роу. — Если вы увидели его через телескоп, вы могли находиться в полумиле от него, и он бы не знал, что вы наблюдаете. Если же телескоп держал он, значит, вы были достаточно близко, чтобы разглядеть это отчётливо — а это делает вас свидетелем того, чем он с этим телескопом занимался».\n\n'
            'Астроном задумался. «В таком случае, полагаю, я имел в виду и то, и другое. Я пользовался своим телескопом. И через него увидел, что он тоже держит телескоп, направленный на мой дом».\n\n'
            'Роу отложил ручку. «Значит, он наблюдал за вами, наблюдающим за ним, через телескопы, в один и тот же момент?»\n\n'
            '«Астрономия, — торжественно произнёс старик, — тесный мир».'
        ),
        'body_tg': (
            'Детектив Роу изҳороти шоҳидро бори сеюм бо овоз баланд хонд. «Ман марди бо телескопро дидам». Ӯ абрувонашро гиреҳ кард. «Шумо дар назар доштед, ки бо телескоп ӯро дидед? Ё худи мард телескопро дар даст дошт?»\n\n'
            'Шоҳид, ситорашиноси солхӯрда, каме ранҷида менамуд. «Оё ин муҳим аст?»\n\n'
            '«Ин бениҳоят муҳим аст, — гуфт Роу. — Агар шумо ӯро тавассути телескоп дидед, шумо метавонистед дар ним мил дур бошед, ва ӯ намедонист, ки шумо тамошо мекунед. Агар телескопро худи ӯ дошт, пас шумо ба қадри кофӣ наздик будед, ки онро равшан бинед — ва ин шуморо шоҳиди он чи ӯ бо он телескоп мекард, месозад».\n\n'
            'Ситорашинос андеша кард. «Дар ин ҳолат, гумон мекунам, ҳарду маъниро дар назар доштам. Ман телескопи худамро истифода мебурдам. Ва тавассути он дидам, ки ӯ ҳам телескопе дошт, ба хонаи ман нигаронида шуда».\n\n'
            'Роу қаламашро гузошт. «Пас ӯ шуморо тамошо мекард, ки шумо ӯро тамошо мекардед, тавассути телескопҳо, дар як лаҳза?»\n\n'
            '«Астрономия, — ҷиддӣ гуфт пирамард, — олами хурд аст».'
        ),
        'word_dictionary': {
            'witness statement': {'ru': 'показания свидетеля', 'tg': 'изҳороти шоҳид', 'lemma': 'witness statement'},
            'frown': {'ru': 'хмуриться', 'tg': 'абрувон гиреҳ кардан', 'lemma': 'frown'},
            'offended': {'ru': 'оскорблённый', 'tg': 'ранҷида', 'lemma': 'offended'},
            'solemnly': {'ru': 'торжественно', 'tg': 'ҷиддӣ', 'lemma': 'solemnly'},
        },
        'story_words': [
            ('frown', 'verb', 'frown'), ('offended', 'adjective', 'offended'), ('solemnly', 'adverb', 'solemnly'),
        ],
        'questions': [
            ('Why does Detective Rowe say the ambiguous sentence matters so much?',
             'Почему детектив Роу говорит, что неоднозначное предложение так важно?',
             'Детектив Роу чаро мегӯяд, ки ин ҷумлаи норавшан ин қадар муҳим аст?',
             ['Because it determines how close the witness was and what she actually saw', 'Because the report needs correct grammar', 'Because the astronomer was lying'],
             'Because it determines how close the witness was and what she actually saw',
             'The two readings change whether she was far away or close enough to be a witness to the action.',
             'Два толкования меняют, была ли она далеко или достаточно близко, чтобы быть свидетелем действия.',
             'Ду маънии ҷумла тағйир медиҳанд, ки оё вай дур буд ё ба қадри кофӣ наздик, то шоҳиди амал бошад.'),
            ('What does the astronomer finally clarify?',
             'Что астроном в итоге проясняет?',
             'Ситорашинос дар ниҳоят чиро равшан мекунад?',
             ['Both readings were true at once', 'Only the first reading was true', 'Neither reading was true'],
             'Both readings were true at once',
             "She was using her own telescope, and through it saw the man also holding one.",
             'Она пользовалась своим телескопом и через него увидела, что мужчина тоже держит телескоп.',
             'Вай телескопи худро истифода мебурд ва тавассути он дид, ки мард низ телескопе дорад.'),
            ("What is the astronomer's final comment about?",
             'О чём последняя реплика астронома?',
             'Изҳороти охирини ситорашинос дар бораи чист?',
             ['How small the world of astronomy is', 'How expensive telescopes are', 'How rude the detective was'],
             'How small the world of astronomy is',
             "The astronomer solemnly comments that 'astronomy is a small world.'",
             'Астроном торжественно замечает: «Астрономия — тесный мир».',
             'Ситорашинос ҷиддӣ мегӯяд: «Астрономия олами хурд аст».'),
        ],
    },
    {
        'title_en': 'She Did Care, in Her Own Way', 'title_ru': 'Она действительно любила — по-своему', 'title_tg': 'Вай воқеан парво мекард — ба тарзи худ',
        'genre': 'drama', 'grammar_topic': 'idiomatic grammar: phrasal-prepositional verbs',
        'body_en': (
            "People assumed my mother didn't care. She never came to school events, never asked "
            "about grades, never sat through a single parents' evening. But she did care — she "
            "just showed it in ways nobody thought to look for.\n\n"
            'She was the one who got up at five to iron my uniform. She was the one who, without '
            'a word, put an extra sandwich in my bag on the mornings I looked tired. She never '
            'said "I love you" out loud — that wasn\'t her language. Her language was action: '
            'quiet, consistent, unglamorous.\n\n'
            "That said, I resented her for years. I wanted the version of love I saw in other "
            "families — spoken, visible, easy to point to. It took me a long time to stop "
            "comparing her silence to their noise, and to start reading what she was actually "
            "saying.\n\n"
            "She did love me. She just never put it into words. And once I understood that, I "
            "understood her."
        ),
        'body_ru': (
            'Люди считали, что моей маме всё равно. Она никогда не приходила на школьные мероприятия, никогда не спрашивала об оценках, ни разу не высидела ни одного родительского собрания. Но ей было не всё равно — она просто показывала это так, что никто не догадывался туда смотреть.\n\n'
            'Именно она вставала в пять утра, чтобы погладить мою форму. Именно она, без единого слова, клала лишний бутерброд в мой рюкзак по утрам, когда я выглядел уставшим. Она никогда не говорила «я тебя люблю» вслух — это был не её язык. Её языком было действие: тихое, постоянное, без всякого блеска.\n\n'
            'При этом я годами держал на неё обиду. Мне хотелось той версии любви, которую я видел в других семьях — произнесённой вслух, заметной, легко объяснимой. Мне потребовалось много времени, чтобы перестать сравнивать её молчание с чужим шумом и начать понимать то, что она на самом деле говорила.\n\n'
            'Она действительно любила меня. Просто никогда не облекала это в слова. И как только я это понял, я понял её.'
        ),
        'body_tg': (
            'Одамон гумон мекарданд, ки модарам ба ман парво надорад. Вай ҳаргиз ба чорабиниҳои мактаб намеомад, ҳеҷ гоҳ дар бораи бааҳо намепурсид, ҳеҷ гоҳ як маҷлиси падару модаронро пурра нанишаст. Аммо вай дар ҳақиқат парво мекард — танҳо онро ба тарзе нишон медод, ки ҳеҷ кас гумон намекард ба он ҷо нигоҳ кунад.\n\n'
            'Маҳз вай буд, ки соати панҷи субҳ мехест, то либоси мактабии маро дарзмол кунад. Маҳз вай буд, ки бе ягон сухан, ба ҷузвдонам дар субҳҳое ки хаста менамудам, сэндвичи иловагӣ мегузошт. Вай ҳаргиз бо овоз «туро дӯст медорам» намегуфт — ин забони ӯ набуд. Забони ӯ амал буд: ором, доимӣ, бе ягон ҷило.\n\n'
            'Бо вуҷуди ин, ман солҳо аз ӯ ранҷида мегаштам. Ман он навъи муҳаббатеро мехостам, ки дар оилаҳои дигар медидам — бо овоз гуфташуда, намоён, ба осонӣ нишондодашаванда. Ба ман вақти зиёде лозим шуд, то хомӯшии ӯро бо садои дигарон муқоиса кардан бас кунам ва фаҳмидани он чи вай дар асл мегуфт, сар кунам.\n\n'
            'Вай воқеан маро дӯст медошт. Танҳо ҳаргиз онро ба калима напечонд. Ва ҳамин ки ин фаҳмидам, ӯро фаҳмидам.'
        ),
        'word_dictionary': {
            'resent': {'ru': 'обижаться, затаить обиду', 'tg': 'ранҷидан', 'lemma': 'resent'},
            'unglamorous': {'ru': 'без блеска, невзрачный', 'tg': 'бе ҷило', 'lemma': 'unglamorous'},
            'consistent': {'ru': 'постоянный, последовательный', 'tg': 'доимӣ', 'lemma': 'consistent'},
            'point to': {'ru': 'указать на, привести в пример', 'tg': 'нишон додан', 'lemma': 'point to'},
            'put into words': {'ru': 'облечь в слова', 'tg': 'ба калима гардондан', 'lemma': 'put into words'},
        },
        'story_words': [
            ('resent', 'verb', 'resent'), ('consistent', 'adjective', 'consistent'),
            ('unglamorous', 'adjective', 'unglamorous'), ('put into words', 'phrase', 'put into words'),
        ],
        'questions': [
            ('What did the mother do every morning to show her care?',
             'Что мать делала каждое утро, чтобы показать заботу?',
             'Модар ҳар субҳ барои нишон додани ғамхорӣ чӣ мекард?',
             ['Got up at five to iron the uniform', 'Wrote a note in the lunchbox', 'Drove the narrator to school'],
             'Got up at five to iron the uniform',
             'She was the one who got up at five to iron the narrator\'s uniform.',
             'Именно она вставала в пять утра, чтобы погладить форму рассказчика.',
             'Маҳз вай соати панҷи субҳ мехест, то либоси мактабии ровиро дарзмол кунад.'),
            ('Why did the narrator resent their mother for years?',
             'Почему рассказчик годами обижался на мать?',
             'Ровӣ солҳо чаро аз модараш ранҷида буд?',
             ['They wanted a more visible, spoken kind of love', 'The mother was often absent from home', 'The mother criticized them constantly'],
             'They wanted a more visible, spoken kind of love',
             'The narrator wanted the spoken, visible kind of love seen in other families.',
             'Рассказчик хотел ту произнесённую вслух, заметную любовь, которую видел в других семьях.',
             'Ровӣ он навъи муҳаббати бо овоз гуфташуда ва намоёнро мехост, ки дар оилаҳои дигар медид.'),
            ('What did the narrator finally understand about the mother?',
             'Что рассказчик наконец понял о матери?',
             'Ровӣ дар бораи модараш ниҳоят чиро фаҳмид?',
             ['That she showed love through actions instead of words', 'That she never actually loved them', 'That she preferred the other children'],
             'That she showed love through actions instead of words',
             'The narrator understood she loved them, she just never put it into words.',
             'Рассказчик понял, что мать любила его, просто никогда не облекала это в слова.',
             'Ровӣ фаҳмид, ки модараш ӯро дӯст медошт, танҳо ҳаргиз онро ба калима намегардонд.'),
        ],
    },
]


async def seed_stories(db):
    created = 0
    skipped = 0

    for idx, item in enumerate(STORIES, start=8):
        source_key = f'seed:C2:story:{idx}'
        existing = (
            await db.execute(select(Stories).where(Stories.source_key == source_key))
        ).scalar_one_or_none()

        if existing is not None:
            skipped += 1
            continue

        story = Stories(
            title_en=item['title_en'],
            title_ru=item['title_ru'],
            title_tg=item['title_tg'],
            body_en=item['body_en'],
            body_ru=item['body_ru'],
            body_tg=item['body_tg'],
            cefr_level='C2',
            genre=item['genre'],
            grammar_topic=item['grammar_topic'],
            word_dictionary=item['word_dictionary'],
            source_key=source_key,
        )
        db.add(story)
        await db.flush()

        for word, pos, context in item['story_words']:
            entry = item['word_dictionary'].get(word, {})
            db.add(StoryWords(
                story_id=story.id,
                word=word,
                translation_ru=entry.get('ru'),
                translation_tg=entry.get('tg'),
                part_of_speech=pos,
                context=context,
            ))

        for text_en, text_ru, text_tg, options, answer, expl_en, expl_ru, expl_tg in item['questions']:
            db.add(StoryQuestions(
                story_id=story.id,
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

    return created, skipped


async def main():
    async with AsyncSessionLocal() as db:
        created, skipped = await seed_stories(db)
        await db.commit()
        print(f'stories: created {created}, skipped {skipped} (already seeded)')


if __name__ == '__main__':
    asyncio.run(main())
