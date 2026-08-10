import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories, StoryQuestions, StoryWords

STORIES = [
    {
        'title_en': 'The Interview', 'title_ru': 'Допрос', 'title_tg': 'Мусоҳиба',
        'genre': 'drama', 'grammar_topic': 'hedging and precision modality',
        'body_en': (
            'The lawyer studied the folder for a long moment before looking up. "Mr. Kalandarov, '
            'the evidence against your client is, shall we say, far from conclusive. But it is not '
            'nothing, either."\n\n'
            'He might well be innocent, she thought. Everything about his manner suggested a man '
            'untroubled by guilt — yet innocence could not simply be inferred from composure. '
            'She had seen too many calm liars.\n\n'
            '"The prosecution\'s case," she continued, "hinges almost entirely on a single witness. '
            'His testimony could conceivably be mistaken; people misremember faces under stress. '
            'That said, it would be unwise to assume the jury will share our scepticism."\n\n'
            "Kalandarov's hands, folded neatly on the table, did not move. \"So what are my "
            'chances?"\n\n'
            '"Honestly? I couldn\'t say with any certainty. If the witness holds up under '
            'cross-examination, you are bound to face real difficulty. If he falters, the whole '
            'case could conceivably collapse."\n\n'
            'She was not in the habit of offering false comfort, and she did not intend to start '
            'now. What she could offer was precision: not hope, but an honest accounting of '
            'probabilities.\n\n'
            '"There is one more thing," she added. "The detective who took his statement has, by '
            'all accounts, a reputation for cutting corners. If that can be substantiated, it '
            'might well change everything."\n\n'
            'For the first time, something like hope flickered across his face — cautious, '
            'but real.\n\n'
            '"Don\'t celebrate," she said quietly. "Not yet. We have work to do first."'
        ),
        'body_ru': (
            'Адвокат долго изучала папку, прежде чем поднять взгляд. «Господин Каландаров, улики против вашего клиента, скажем так, далеко не убедительны. Но их и не назвать пустыми».\n\n'
            'Возможно, он действительно невиновен, подумала она. Всё в его манере говорило о человеке, не отягощённом чувством вины — и всё же невиновность нельзя просто вывести из спокойствия. Она видела слишком много хладнокровных лжецов.\n\n'
            '«Дело обвинения, — продолжила она, — почти полностью держится на показаниях одного свидетеля. Вполне возможно, что он ошибается: под стрессом люди путают лица. При этом было бы неразумно рассчитывать, что присяжные разделят наш скептицизм».\n\n'
            'Руки Каландарова, аккуратно сложенные на столе, не шевельнулись. «И каковы мои шансы?»\n\n'
            '«Честно? Не могу сказать наверняка. Если свидетель выдержит перекрёстный допрос, вас неминуемо ждут серьёзные трудности. Если же он собьётся, всё дело вполне может рассыпаться».\n\n'
            'Она не имела привычки давать ложную надежду и не собиралась начинать сейчас. Что она могла предложить — так это точность: не надежду, а честный расчёт вероятностей.\n\n'
            '«Есть ещё кое-что, — добавила она. — У детектива, снявшего его показания, по общему мнению, репутация человека, который экономит на процедуре. Если это удастся подтвердить, всё может измениться».\n\n'
            'Впервые на его лице мелькнуло что-то похожее на надежду — осторожное, но настоящее.\n\n'
            '«Не радуйтесь, — тихо сказала она. — Пока рано. Сначала нам предстоит поработать».'
        ),
        'body_tg': (
            'Ҳуқуқшинос муддате дароз ба папка нигоҳ карда, сипас сарашро бардошт. «Ҷаноби Қаландаров, далелҳо бар зидди мизоҷи шумо, гӯем, чандон қатъӣ нестанд. Аммо онҳоро низ холӣ гуфтан мумкин нест».\n\n'
            'Шояд ӯ дар ҳақиқат бегуноҳ бошад, — фикр кард вай. Ҳамаи рафтори ӯ марди бегуноҳро нишон медод — вале бегуноҳиро наметавон танҳо аз оромӣ хулоса кард. Вай дурӯғгӯёни хунсари зиёдеро дида буд.\n\n'
            '«Парвандаи айбдоркуниҳо, — идома дод вай, — қариб пурра ба шаҳодати як шоҳид такя мезанад. Эҳтимол аст, ки ӯ хато карда бошад; одамон дар фишор чеҳраҳоро иштибоҳ мекунанд. Бо вуҷуди ин, оқилона нест, ки гумон кунем, ҳакамон шубҳаи моро тақсим мекунанд».\n\n'
            'Дастони Қаландаров, ки бо тартиб дар болои миз гузошта шуда буданд, ҷунбиш накарданд. «Пас имконияти ман чӣ гуна аст?»\n\n'
            '«Ростӣ? Наметавонам бо итминон гӯям. Агар шоҳид дар пурсиши мутақобила тоб орад, шумо бешубҳа бо мушкилоти ҷиддӣ рӯбарӯ мешавед. Агар ӯ ба хато афтад, тамоми парванда метавонад фурӯ резад».\n\n'
            'Вай одати тасаллои бардурӯғ додан надошт ва ҳоло ҳам ин корро сар карданро намехост. Он чизе ки пешниҳод карда метавонист, дақиқӣ буд: на умед, балки ҳисоби рости эҳтимолот.\n\n'
            '«Боз як чиз ҳаст, — илова кард вай. — Детективе, ки ифодаи ӯро гирифт, бо ривояти умум, номи касеро дорад, ки корро сарсарӣ мекунад. Агар ин собит шавад, шояд ҳама чиз тағйир ёбад».\n\n'
            'Бори аввал чизе ба монанди умед дар чеҳраи ӯ дурахшид — эҳтиёткорона, вале ҳақиқӣ.\n\n'
            '«Шодӣ накунед, — оҳиста гуфт вай. — Ҳанӯз не. Аввал бояд кор кунем».'
        ),
        'word_dictionary': {
            'conclusive': {'ru': 'убедительный, окончательный', 'tg': 'қотеъ', 'lemma': 'conclusive'},
            'infer': {'ru': 'делать вывод', 'tg': 'хулоса баровардан', 'lemma': 'infer'},
            'composure': {'ru': 'самообладание', 'tg': 'хунсардӣ', 'lemma': 'composure'},
            'hinge on': {'ru': 'зависеть от, держаться на', 'tg': 'вобаста будан ба', 'lemma': 'hinge'},
            'testimony': {'ru': 'показания', 'tg': 'шаҳодат', 'lemma': 'testimony'},
            'scepticism': {'ru': 'скептицизм', 'tg': 'шубҳа', 'lemma': 'scepticism'},
            'falter': {'ru': 'колебаться, сбиться', 'tg': 'ба хато афтодан', 'lemma': 'falter'},
            'accounting': {'ru': 'расчёт, оценка', 'tg': 'ҳисоб', 'lemma': 'accounting'},
            'by all accounts': {'ru': 'по общему мнению', 'tg': 'бо ривояти умум', 'lemma': 'account'},
            'cut corners': {'ru': 'экономить в ущерб качеству', 'tg': 'корро сарсарӣ кардан', 'lemma': 'cut corners'},
            'substantiate': {'ru': 'подтверждать', 'tg': 'собит кардан', 'lemma': 'substantiate'},
            'flicker': {'ru': 'мелькать, мерцать', 'tg': 'дурахшидан', 'lemma': 'flicker'},
        },
        'story_words': [
            ('conclusive', 'adjective', 'conclusive'), ('composure', 'noun', 'composure'),
            ('testimony', 'noun', 'testimony'), ('falter', 'verb', 'falter'),
            ('substantiate', 'verb', 'substantiate'), ('cut corners', 'phrase', 'cut corners'),
        ],
        'questions': [
            ("Why does the lawyer say Kalandarov's innocence can't simply be assumed?",
             'Почему адвокат говорит, что невиновность Каландарова нельзя просто предполагать?',
             'Чаро ҳуқуқшинос мегӯяд, ки бегуноҳии Қаландаровро наметавон танҳо тахмин кард?',
             ['Because calm behaviour is not proof of innocence', 'Because he confessed earlier', 'Because the judge said so'],
             'Because calm behaviour is not proof of innocence',
             "She notes that composure doesn't prove innocence — she's seen many calm liars.",
             'Она замечает, что спокойствие не доказывает невиновность — она видела много хладнокровных лжецов.',
             'Вай қайд мекунад, ки оромӣ бегуноҳиро исбот намекунад — вай дурӯғгӯёни хунсарди зиёдеро дидааст.'),
            ('What does the whole case mainly depend on?',
             'От чего в основном зависит всё дело?',
             'Тамоми парванда асосан ба чӣ вобаста аст?',
             ['A single witness', 'Physical evidence', "The detective's opinion"],
             'A single witness',
             "The lawyer says the prosecution's case hinges almost entirely on one witness.",
             'Адвокат говорит, что дело обвинения почти полностью держится на одном свидетеле.',
             'Ҳуқуқшинос мегӯяд, ки парвандаи айбдоркунӣ қариб пурра ба як шоҳид такя мекунад.'),
            ('What might change everything, according to the lawyer?',
             'Что, по словам адвоката, может изменить всё?',
             'Мувофиқи гуфти ҳуқуқшинос, чӣ метавонад ҳама чизро тағйир диҳад?',
             ["Proof that the detective cut corners", 'A new witness', "Kalandarov's confession"],
             'Proof that the detective cut corners',
             "If the detective's sloppy procedure can be substantiated, it might well change everything.",
             'Если удастся подтвердить небрежность детектива в процедуре, всё может измениться.',
             'Агар сарсарикории детектив собит шавад, ҳама чиз метавонад тағйир ёбад.'),
        ],
    },
    {
        'title_en': 'Ten Years Later', 'title_ru': 'Десять лет спустя', 'title_tg': 'Даҳ соли баъд',
        'genre': 'memoir', 'grammar_topic': 'subtle tense shifts: historic present & free indirect style',
        'body_en': (
            "Ten years on, and here I am again, standing outside the house I grew up in. I press "
            "the doorbell. Nobody answers. Of course nobody answers — the family moved away "
            "years ago, though somehow I always forget that when I come back.\n\n"
            "I walk around to the garden gate instead. It's rusted now, and it groans when I push "
            "it open. The apple tree is gone. Why had nobody told her that? She would have wanted "
            "to know.\n\n"
            "I sit on the low wall where I used to do my homework, half-listening for a voice that "
            "isn't coming. Would anyone even recognise me now? I doubt it. Ten years changes a face "
            "more than people admit.\n\n"
            "A woman appears at the neighbouring window, curious. I wave, and after a moment, she "
            "waves back — carefully, the way you greet a stranger who might not be one.\n\n"
            "I turn and walk back toward the car. Behind me, the gate groans shut on its own, as "
            "if closing the conversation I never quite had."
        ),
        'body_ru': (
            'Прошло десять лет — и вот я снова стою у дома, в котором вырос. Нажимаю на звонок. Никто не отвечает. Конечно, никто не отвечает — семья давно переехала, хотя, возвращаясь сюда, я почему-то всякий раз забываю об этом.\n\n'
            'Вместо этого я обхожу дом к калитке сада. Теперь она проржавела и скрипит, когда я толкаю её. Яблони больше нет. Почему ей никто не сказал? Она бы хотела знать.\n\n'
            'Сажусь на низкой стене, где когда-то делал уроки, вполуха прислушиваясь к голосу, который не раздастся. Узнал бы меня теперь хоть кто-нибудь? Сомневаюсь. Десять лет меняют лицо сильнее, чем принято признавать.\n\n'
            'В соседнем окне появляется женщина, с любопытством смотрит на меня. Я машу рукой, и через мгновение она машет в ответ — осторожно, так приветствуют незнакомца, который, возможно, не совсем незнакомец.\n\n'
            'Разворачиваюсь и иду обратно к машине. Позади меня калитка сама собой захлопывается со скрипом, будто завершая разговор, который у меня так и не получился.'
        ),
        'body_tg': (
            'Даҳ сол гузашт — ва ман боз дар назди хонае, ки дар он калон шудам, истодаам. Занги дарро мезанам. Ҳеҷ кас ҷавоб намедиҳад. Албатта, ҳеҷ кас ҷавоб намедиҳад — оила солҳо пеш кӯчидааст, гарчанде ҳар боре ки бармегардам, ин чизро фаромӯш мекунам.\n\n'
            'Ба ҷойи он ба тарафи дарвозаи боғ мегардам. Ҳоло он занг задааст ва ҳангоми тела доданам ғиҷиррос мезанад. Дарахти себ дигар нест. Чаро касе ба вай нагуфта буд? Вай мехост, ки бидонад.\n\n'
            'Ман дар девори пасти он ҷое, ки замоне вазифаи хонагиро иҷро мекардам, менишинам ва бо гӯши ним ба овозе, ки намеояд, гӯш медиҳам. Оё касе ҳоло маро мешиносад? Шак дорам. Даҳ сол чеҳраро бештар аз он чи одамон эътироф мекунанд, тағйир медиҳад.\n\n'
            'Дар тирезаи ҳамсоягӣ зане пайдо мешавад, бо кунҷковӣ. Ман даст мебардорам ва пас аз лаҳзае вай ҳам ҷавоб медиҳад — эҳтиёткорона, ба тарзе ки бегонаеро, ки шояд бегона набошад, салом медиҳанд.\n\n'
            'Ман мегардам ва ба сӯи мошин меравам. Дар паси ман дарвоза худ аз худ бо ғиҷиррос пӯшида мешавад, гӯё сӯҳбатеро, ки ҳаргиз пурра нашуда буд, ба анҷом мерасонад.'
        ),
        'word_dictionary': {
            'grow up': {'ru': 'вырасти', 'tg': 'калон шудан', 'lemma': 'grow up'},
            'rusted': {'ru': 'проржавевший', 'tg': 'зангзада', 'lemma': 'rust'},
            'groan': {'ru': 'скрипеть, стонать', 'tg': 'ғиҷиррос задан', 'lemma': 'groan'},
            'half-listening': {'ru': 'вполуха слушая', 'tg': 'бо гӯши ним гӯш кардан', 'lemma': 'half-listening'},
            'recognise': {'ru': 'узнавать (кого-то)', 'tg': 'шинохтан', 'lemma': 'recognise'},
            'curious': {'ru': 'любопытный', 'tg': 'кунҷков', 'lemma': 'curious'},
            'stranger': {'ru': 'незнакомец', 'tg': 'бегона', 'lemma': 'stranger'},
        },
        'story_words': [
            ('rusted', 'adjective', 'rusted'), ('groan', 'verb', 'groan'),
            ('recognise', 'verb', 'recognise'), ('stranger', 'noun', 'stranger'),
        ],
        'questions': [
            ('Why does nobody answer the door?',
             'Почему никто не открывает дверь?',
             'Чаро касе дарро намекушояд?',
             ['The family moved away years ago', 'Nobody is home right now', 'The doorbell is broken'],
             'The family moved away years ago',
             'The narrator explains the family moved away years earlier, though they keep forgetting it.',
             'Рассказчик объясняет, что семья давно переехала, хотя он всё время об этом забывает.',
             'Ровӣ мефаҳмонад, ки оила солҳо пеш кӯчидааст, гарчанде ин чизро ҳамеша фаромӯш мекунад.'),
            ('What has disappeared from the garden?',
             'Что исчезло из сада?',
             'Аз боғ чӣ нест шудааст?',
             ['The apple tree', 'The low wall', 'The gate'],
             'The apple tree',
             'The narrator notices the apple tree is gone.',
             'Рассказчик замечает, что яблони больше нет.',
             'Ровӣ мутаваҷҷеҳ мешавад, ки дарахти себ дигар нест.'),
            ('How does the neighbour react when the narrator waves?',
             'Как соседка реагирует, когда рассказчик машет рукой?',
             'Ҳамсоя ҳангоми даст ҷунбондани ровӣ чӣ вокуниш нишон медиҳад?',
             ['She waves back cautiously', 'She closes the curtains', 'She calls out a greeting'],
             'She waves back cautiously',
             "She waves back carefully, the way you'd greet a stranger.",
             'Она осторожно машет в ответ — так, как приветствуют незнакомца.',
             'Вай эҳтиёткорона дар ҷавоб даст мебардорад — ба тарзе, ки ба бегона салом медиҳанд.'),
        ],
    },
    {
        'title_en': "The Committee's Report", 'title_ru': 'Отчёт комиссии', 'title_tg': 'Ҳисоботи комиссия',
        'genre': 'satire', 'grammar_topic': 'complex noun phrases',
        'body_en': (
            "The long-awaited, much-delayed report on municipal park renovation finally reached the "
            "mayor's desk this morning, three years after the original, now largely forgotten, "
            "request was filed.\n\n"
            'Its recommendations — a carefully worded, deliberately vague set of suggestions '
            'authored by a committee nobody remembers appointing — propose, among other '
            'things, "a phased, community-informed approach to green space optimisation."\n\n'
            'Nobody at the meeting could quite explain what this meant. The deputy mayor, a '
            'visibly tired man with thirty years of unread reports behind him, asked whether '
            '"phased" meant this decade or the next. The committee\'s spokesperson, a young woman '
            'clutching a laptop she never opened, offered a long, carefully hedged non-answer '
            'involving "further consultation."\n\n'
            'Outside, in the actual park under discussion, the broken swings that prompted the '
            'whole process three years ago remain exactly where they were — rusted, quietly '
            'ignored, and now the subject of an eighty-page document that recommends, in essence, '
            'further discussion.'
        ),
        'body_ru': (
            'Долгожданный, многократно отложенный отчёт о реконструкции городского парка сегодня утром наконец попал на стол мэра — спустя три года после подачи первоначального, ныне почти забытого запроса.\n\n'
            'Его рекомендации — тщательно и намеренно расплывчато сформулированный набор предложений, составленный комиссией, о назначении которой никто уже не помнит, — предлагают, среди прочего, «поэтапный, учитывающий мнение жителей подход к оптимизации зелёных зон».\n\n'
            'Никто на заседании толком не смог объяснить, что это значит. Заместитель мэра, явно уставший человек с тридцатилетним стажем непрочитанных отчётов, спросил, означает ли «поэтапный» это десятилетие или следующее. Представительница комиссии, молодая женщина, сжимавшая ноутбук, который так и не открыла, дала длинный, тщательно уклончивый неответ о «дальнейших консультациях».\n\n'
            'Тем временем в самом парке, о котором шла речь, сломанные качели, из-за которых всё и началось три года назад, стоят на том же месте — ржавые, тихо забытые и теперь являющиеся предметом восьмидесятистраничного документа, рекомендующего, по сути, продолжить обсуждение.'
        ),
        'body_tg': (
            'Ҳисоботи дуртаранзарида ва борҳо ба таъхир афтодаи дар бораи барқарорсозии боғи шаҳрӣ имрӯз субҳ ниҳоят ба мизи шаҳрдор расид — се сол пас аз пешниҳоди аризаи аввалия, ки ҳоло қариб фаромӯш шудааст.\n\n'
            'Тавсияҳои он — маҷмӯи бодиққат ва қасдан норавшани пешниҳодҳо аз ҷониби комиссияе, ки таъиноти онро ҳеҷ кас дар ёд надорад — «равиши марҳилавӣ ва бо назардошти фикри аҳолӣ»-ро барои беҳтар кардани фазои сабз пешниҳод мекунад.\n\n'
            'Ҳеҷ кас дар ҷаласа наметавонист аниқ шарҳ диҳад, ки ин чиро маънидод мекунад. Муовини шаҳрдор пурсид, ки «марҳилавӣ» ин даҳсола ё дигарашро дар назар дорад. Намояндаи комиссия ҷавоби дарози эҳтиёткоронаеро дар бораи «машваратҳои минбаъда» пешниҳод кард.\n\n'
            'Дар ин ҳол, дар худи боғе, ки сухан дар бораи он мерафт, тобхӯрдаҳои шикастае, ки се сол пеш тамоми ин раванди сар шуда буд, дар ҳамон ҷо мондаанд — зангзада, ором фаромӯшшуда ва ҳоло мавзӯи ҳуҷҷати ҳаштод саҳифагӣ, ки моҳиятан идомаи баҳсро тавсия медиҳад.'
        ),
        'word_dictionary': {
            'long-awaited': {'ru': 'долгожданный', 'tg': 'дуртаранзарида', 'lemma': 'long-awaited'},
            'municipal': {'ru': 'муниципальный, городской', 'tg': 'шаҳрӣ', 'lemma': 'municipal'},
            'file (a request)': {'ru': 'подавать (запрос)', 'tg': 'пешниҳод кардан', 'lemma': 'file'},
            'deliberately': {'ru': 'намеренно', 'tg': 'қасдан', 'lemma': 'deliberately'},
            'vague': {'ru': 'расплывчатый', 'tg': 'норавшан', 'lemma': 'vague'},
            'phased': {'ru': 'поэтапный', 'tg': 'марҳилавӣ', 'lemma': 'phased'},
            'clutch': {'ru': 'сжимать', 'tg': 'сахт нигоҳ доштан', 'lemma': 'clutch'},
            'hedged': {'ru': 'уклончивый', 'tg': 'эҳтиёткорона', 'lemma': 'hedge'},
            'in essence': {'ru': 'по сути', 'tg': 'моҳиятан', 'lemma': 'essence'},
        },
        'story_words': [
            ('municipal', 'adjective', 'municipal'), ('vague', 'adjective', 'vague'),
            ('phased', 'adjective', 'phased'), ('in essence', 'phrase', 'in essence'),
        ],
        'questions': [
            ('How long after the original request did the report arrive?',
             'Сколько времени прошло с момента подачи первоначального запроса до появления отчёта?',
             'Пас аз пешниҳоди аризаи аввалия ҳисобот пас аз чанд вақт омад?',
             ['Three years', 'One year', 'Ten years'],
             'Three years',
             'The report arrived three years after the original request was filed.',
             'Отчёт появился спустя три года после подачи первоначального запроса.',
             'Ҳисобот се сол пас аз пешниҳоди аризаи аввалия расид.'),
            ('What does the deputy mayor ask about?',
             'О чём спрашивает заместитель мэра?',
             'Муовини шаҳрдор дар бораи чӣ мепурсад?',
             ['What "phased" actually means', 'Who wrote the report', 'How much the renovation costs'],
             'What "phased" actually means',
             "He asks whether 'phased' means this decade or the next.",
             'Он спрашивает, означает ли «поэтапный» это десятилетие или следующее.',
             'Ӯ мепурсад, ки «марҳилавӣ» ин даҳсола ё дигарашро дар назар дорад.'),
            ('What is the actual state of the park at the end of the story?',
             'В каком состоянии находится сам парк в конце истории?',
             'Дар охири ҳикоя боғ дар кадом ҳолат аст?',
             ['The broken swings are still there, unrepaired', 'The swings have been fixed', 'The park has been closed'],
             'The broken swings are still there, unrepaired',
             'The broken swings that started the whole process remain exactly where they were.',
             'Сломанные качели, с которых всё началось, стоят на том же месте.',
             'Тобхӯрдаҳои шикаста, ки тамоми раванд аз онҳо сар шуда буд, дар ҳамон ҷо мондаанд.'),
        ],
    },
    {
        'title_en': 'It Was Never About the Money', 'title_ru': 'Дело было не в деньгах', 'title_tg': 'Масъала дар пул набуд',
        'genre': 'drama', 'grammar_topic': 'advanced cleft and pseudo-cleft structures',
        'body_en': (
            '"You think this is about the money," she said. "It isn\'t. It was never about the '
            'money."\n\n'
            "He didn't answer. It was the silence that told her she was right — the silence, "
            "and the way he wouldn't meet her eyes.\n\n"
            '"It was trust I wanted," she continued. "It was honesty. The money I could have '
            "forgiven in an afternoon. What I can't forgive is that you let me find out from "
            'someone else."\n\n'
            '"I was going to tell you," he said finally.\n\n'
            '"Were you? Or is that just what it\'s easiest to believe now?"\n\n'
            "It was at that moment, watching him search for an answer he didn't have, that she "
            "understood something she'd been avoiding for months: it wasn't a single lie she was "
            "angry about. It was every quiet, comfortable decision not to tell her the truth."
        ),
        'body_ru': (
            '«Ты думаешь, дело в деньгах, — сказала она. — Это не так. Дело никогда не было в деньгах».\n\n'
            'Он не ответил. Именно молчание сказало ей, что она права — молчание и то, как он избегал её взгляда.\n\n'
            '«Мне нужно было доверие, — продолжила она. — Мне нужна была честность. Деньги я простила бы за один вечер. Чего я не могу простить — так это того, что ты позволил мне узнать от кого-то другого».\n\n'
            '«Я собирался тебе сказать», — произнёс он наконец.\n\n'
            '«Собирался? Или тебе просто легче так думать сейчас?»\n\n'
            'Именно в этот момент, глядя, как он ищет ответ, которого у него нет, она поняла то, что избегала месяцами: её злила не одна ложь. Её злило каждое тихое, удобное решение не говорить ей правду.'
        ),
        'body_tg': (
            '«Ту фикр мекуни, ки масъала дар пул аст, — гуфт вай. — Не. Масъала ҳеҷ гоҳ дар пул набуд».\n\n'
            'Ӯ ҷавоб надод. Маҳз хомӯшӣ ба вай гуфт, ки ҳақ ба ҷониби вай аст — хомӯшӣ ва он ки чашмонашро аз вай дур мегардонд.\n\n'
            '«Ба ман бовар лозим буд, — идома дод вай. — Ба ман ростқавлӣ лозим буд. Пулро як бегоҳ мебахшидам. Чизе ки бахшида наметавонам, ин аст, ки ту гузоштӣ аз касе дигар бифаҳм».\n\n'
            '«Ман мехостам ба ту бигӯям», — оқибат гуфт ӯ.\n\n'
            '«Дар ҳақиқат? ё ин ҳоло барои ту фикр карданаш осонтар аст?»\n\n'
            'Маҳз дар ҳамон лаҳза, дида истода, ки ӯ ҷавобе меҷӯяд, ки надорад, вай чизеро фаҳмид, ки моҳҳо аз он канорагирӣ мекард: ӯро на як дурӯғ хашмгин карда буд. Ӯро ҳар қарори ором ва осони нагуфтани ҳақиқат хашмгин карда буд.'
        ),
        'word_dictionary': {
            'trust': {'ru': 'доверие', 'tg': 'бовар', 'lemma': 'trust'},
            'honesty': {'ru': 'честность', 'tg': 'ростқавлӣ', 'lemma': 'honesty'},
            'forgive': {'ru': 'прощать', 'tg': 'бахшидан', 'lemma': 'forgive'},
            'find out': {'ru': 'узнать', 'tg': 'фаҳмидан', 'lemma': 'find out'},
            'avoid': {'ru': 'избегать', 'tg': 'канорагирӣ кардан', 'lemma': 'avoid'},
        },
        'story_words': [
            ('trust', 'noun', 'trust'), ('honesty', 'noun', 'honesty'),
            ('forgive', 'verb', 'forgive'), ('avoid', 'verb', 'avoid'),
        ],
        'questions': [
            ('What does the woman say she actually wanted?',
             'Что, по её словам, ей было нужно на самом деле?',
             'Зан мегӯяд, ки дар ҳақиқат ба вай чӣ лозим буд?',
             ['Trust and honesty', 'More money', 'An apology in writing'],
             'Trust and honesty',
             "She says 'It was trust I wanted... It was honesty.'",
             'Она говорит: «Мне нужно было доверие... Мне нужна была честность».',
             'Вай мегӯяд: «Ба ман бовар лозим буд... Ба ман ростқавлӣ лозим буд».'),
            ('What does she say she could have forgiven easily?',
             'Что, по её словам, она могла бы легко простить?',
             'Вай мегӯяд, ки чиро осон бахшида метавонист?',
             ['The money', 'The lie', 'His silence'],
             'The money',
             "She says the money she could have forgiven in an afternoon.",
             'Она говорит, что деньги простила бы за один вечер.',
             'Вай мегӯяд, ки пулро як бегоҳ мебахшид.'),
            ('What does she realize by the end of the story?',
             'Что она осознаёт к концу истории?',
             'Вай дар охири ҳикоя чиро мефаҳмад?',
             ['She is angry about every quiet decision not to tell her, not just one lie', 'She no longer loves him', 'The money was actually the real issue'],
             'She is angry about every quiet decision not to tell her, not just one lie',
             "She realizes it wasn't a single lie but every quiet decision not to tell her the truth.",
             'Она понимает, что дело не в одной лжи, а в каждом тихом решении не говорить ей правду.',
             'Вай мефаҳмад, ки масъала на дар як дурӯғ, балки дар ҳар қарори ором ва нагуфтани ҳақиқат аст.'),
        ],
    },
]


async def seed_stories(db):
    created = 0
    skipped = 0

    for idx, item in enumerate(STORIES):
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
