import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories, StoryQuestions, StoryWords

STORIES = [
    {
        'title_en': 'What the Silence Said', 'title_ru': 'О чём говорило молчание', 'title_tg': 'Хомӯшӣ чӣ гуфт',
        'genre': 'literary', 'grammar_topic': 'ellipsis: formal vs informal omission',
        'body_en': (
            "The kitchen was quiet in a way it hadn't been in years. No radio. No kettle. Just "
            "the two of them, and the letter on the table between them.\n\n"
            '"Well?" she said.\n\n'
            "He didn't answer. Didn't need to. His face — pale, still, unreadable — said "
            "everything the letter couldn't.\n\n"
            '"So that\'s it, then," she said. Not a question.\n\n'
            'He nodded. Once.\n\n'
            "She looked at the letter again, then at him, then out of the window at nothing in "
            "particular. There was so much to say and, somehow, nothing at all.\n\n"
            '"Twenty years," she said finally. "Twenty years, and this is how we find out."\n\n'
            "He reached for her hand. She let him take it, though she didn't move closer.\n\n"
            "Outside, a car passed. Then another. Ordinary sounds, from an ordinary street, on a "
            "day that had stopped being ordinary the moment the envelope arrived.\n\n"
            "Neither spoke again for a long time. Some silences say more than any sentence could."
        ),
        'body_ru': (
            'Кухня молчала так, как не молчала уже много лет. Ни радио. Ни чайника. Только они вдвоём и письмо на столе между ними.\n\n'
            '«Ну что?» — сказала она.\n\n'
            'Он не ответил. И не нужно было. Его лицо — бледное, неподвижное, непроницаемое — говорило всё, чего не могло сказать письмо.\n\n'
            '«Значит, вот как», — сказала она. Не вопрос.\n\n'
            'Он кивнул. Один раз.\n\n'
            'Она снова посмотрела на письмо, потом на него, потом в окно — ни на что конкретное. Сказать нужно было так много, и всё же — как будто нечего.\n\n'
            '«Двадцать лет, — произнесла она наконец. — Двадцать лет, и вот как мы об этом узнаём».\n\n'
            'Он потянулся к её руке. Она позволила ему взять её, хотя не придвинулась ближе.\n\n'
            'За окном проехала машина. Потом ещё одна. Обычные звуки обычной улицы — в день, который перестал быть обычным в тот миг, когда пришёл конверт.\n\n'
            'Больше долго никто не проронил ни слова. Иногда молчание говорит больше, чем любая фраза.'
        ),
        'body_tg': (
            'Ошхона хомӯш буд, ба тарзе ки солҳо боз чунин набуд. На радио. На чойник. Танҳо онҳо дуто ва мактуб дар болои миз миёни онҳо.\n\n'
            '«Хайр?» — гуфт вай.\n\n'
            'Ӯ ҷавоб надод. Лозим ҳам набуд. Чеҳраи ӯ — рангпарида, беҳаракат, ношинохта — ҳама чизеро, ки мактуб гуфта наметавонист, мегуфт.\n\n'
            '«Пас ҳамин будааст», — гуфт вай. На савол.\n\n'
            'Ӯ сарашро ҷунбонд. Як бор.\n\n'
            'Вай боз ба мактуб нигоҳ кард, сипас ба ӯ, сипас ба тиреза — ба ҳеҷ чизи муайян. Гуфтан лозим буд бисёр чиз, ва бо вуҷуди ин — гӯё ҳеҷ чиз.\n\n'
            '«Бист сол, — гуфт вай оқибат. — Бист сол, ва ҳамин тавр мо инро мефаҳмем».\n\n'
            'Ӯ ба сӯи дасти вай даст дароз кард. Вай гузошт, ки ӯ дасташро гирад, гарчанде наздиктар нашуд.\n\n'
            'Берун мошине гузашт. Баъд боз як мошин. Садоҳои муқаррарии кӯчаи муқаррарӣ — дар рӯзе, ки муқаррарӣ буданашро дар лаҳзаи расидани конверт бас кард.\n\n'
            'Дигар муддате дароз ҳеҷ кас чизе нагуфт. Баъзан хомӯшӣ бештар аз ҳар ҷумла мегӯяд.'
        ),
        'word_dictionary': {
            'unreadable': {'ru': 'непроницаемый (о лице)', 'tg': 'ношинохта', 'lemma': 'unreadable'},
            'nod': {'ru': 'кивать', 'tg': 'сар ҷунбондан', 'lemma': 'nod'},
            'reach for': {'ru': 'потянуться к', 'tg': 'даст дароз кардан ба', 'lemma': 'reach for'},
            'envelope': {'ru': 'конверт', 'tg': 'конверт', 'lemma': 'envelope'},
            'ordinary': {'ru': 'обычный', 'tg': 'муқаррарӣ', 'lemma': 'ordinary'},
        },
        'story_words': [
            ('unreadable', 'adjective', 'unreadable'), ('nod', 'verb', 'nod'),
            ('envelope', 'noun', 'envelope'), ('ordinary', 'adjective', 'ordinary'),
        ],
        'questions': [
            ('What tells the woman the answer, even though the man says nothing?',
             'Что говорит женщине ответ, хотя мужчина ничего не сказал?',
             'Ба зан ҷавобро чӣ мегӯяд, ҳарчанд мард чизе нагуфт?',
             ['His face and his silence', 'A phone call', 'A second letter'],
             'His face and his silence',
             "His unreadable face 'said everything the letter couldn't' — she reads the answer in his silence.",
             'Его непроницаемое лицо «говорило всё, чего не могло сказать письмо» — она читает ответ в его молчании.',
             'Чеҳраи ношинохтаи ӯ «ҳама чизеро, ки мактуб гуфта наметавонист, мегуфт» — вай ҷавобро дар хомӯшии ӯ мехонад.'),
            ('How long had they been together, according to the woman?',
             'Сколько лет они были вместе, по словам женщины?',
             'Мувофиқи гуфти зан, онҳо чанд сол якҷоя буданд?',
             ['Twenty years', 'Ten years', 'Thirty years'],
             'Twenty years',
             "She says 'Twenty years, and this is how we find out.'",
             'Она говорит: «Двадцать лет, и вот как мы об этом узнаём».',
             'Вай мегӯяд: «Бист сол, ва ҳамин тавр мо инро мефаҳмем».'),
            ('What happens right after he reaches for her hand?',
             'Что происходит сразу после того, как он тянется к её руке?',
             'Дарҳол пас аз даст дароз карданти ӯ ба дасти зан чӣ рӯй медиҳад?',
             ['She lets him take it, but does not move closer', 'She pulls her hand away', 'She starts crying'],
             'She lets him take it, but does not move closer',
             'She lets him take her hand, though she does not move closer to him.',
             'Она позволяет ему взять её руку, хотя не придвигается ближе.',
             'Вай мегузорад, ки ӯ дасташро гирад, вале наздиктар намешавад.'),
        ],
    },
    {
        'title_en': 'Not Once Did I Doubt Her', 'title_ru': 'Я ни разу не усомнился в ней', 'title_tg': 'Ман ҳеҷ гоҳ ба вай шубҳа накардам',
        'genre': 'drama', 'grammar_topic': 'inversion after negative adverbials',
        'body_en': (
            'Not once did I doubt her. Not when the accusations started. Not when old friends '
            'began to look away in the street. Not even when the company let her go, quietly, '
            'with a severance package and a request that she never speak of it.\n\n'
            'Rarely have I seen someone so wrongly accused carry it with such grace. Never did '
            'she raise her voice in her own defence. Never did she demand an apology from the '
            'people who owed her one.\n\n'
            '"Why don\'t you fight back?" I asked her once.\n\n'
            '"I did fight," she said. "Just not the way they expected."\n\n'
            'Only later did I understand what she meant. While everyone assumed her silence was '
            'surrender, she had spent those months quietly gathering the evidence that would '
            'eventually clear her name — methodically, patiently, without a single public word.\n\n'
            'Little did they know, as they whispered about her in corridors, that she was three '
            'steps ahead of them the entire time.'
        ),
        'body_ru': (
            'Ни разу я не усомнился в ней. Ни когда начались обвинения. Ни когда старые друзья начали отводить взгляд на улице. Даже когда компания тихо уволила её, с выходным пособием и просьбой никогда об этом не говорить.\n\n'
            'Редко я видел, чтобы кто-то, ложно обвинённый, переносил это с таким достоинством. Она ни разу не повысила голос в свою защиту. Она ни разу не потребовала извинений от тех, кто был ей должен.\n\n'
            '«Почему ты не борешься?» — спросил я её однажды.\n\n'
            '«Я боролась, — сказала она. — Просто не так, как они ожидали».\n\n'
            'Лишь позже я понял, что она имела в виду. Пока все считали её молчание капитуляцией, она месяцами тихо собирала доказательства, которые в итоге очистили её имя — методично, терпеливо, без единого публичного слова.\n\n'
            'И не подозревали они, шепчась о ней в коридорах, что всё это время она была на три шага впереди них.'
        ),
        'body_tg': (
            'Ҳеҷ гоҳ ба вай шубҳа накардам. На вақте ки айбдоркуниҳо сар шуданд. На вақте ки дӯстони кӯҳна дар кӯча нигоҳашонро дур мегардонданд. Ҳатто вақте ки ширкат ӯро оҳиста бо ҷуброни хизматӣ ва хоҳиши ҳеҷ гоҳ дар бораи ин нагуфтан аз кор озод кард.\n\n'
            'Кам дидаам, ки касе ин қадар нохак айбдоршуда ин ҳолатро бо чунин шаъну шараф аз сар гузаронад. Ҳеҷ гоҳ вай барои дифои худ овозашро баланд накард. Ҳеҷ гоҳ вай аз касоне, ки ба вай қарздор буданд, узрхоҳӣ талаб накард.\n\n'
            '«Чаро мубориза намебарӣ?» — боре аз ӯ пурсидам.\n\n'
            '«Ман мубориза бурдам, — гуфт вай. — Танҳо на ба тарзе, ки онҳо интизор буданд».\n\n'
            'Танҳо баъдтар фаҳмидам, ки вай чиро дар назар дошт. Дар ҳоле ки ҳама хомӯшии ӯро таслимшавӣ мешумориданд, вай моҳҳо ором далелҳоеро ҷамъ мекард, ки дар ниҳоят номи ӯро пок мекарданд — бо тартиб, бо сабр, бе ягон сухани оммавӣ.\n\n'
            'Ва онҳо, ки дар долонҳо дар бораи ӯ пичиррос мезаданд, намедонистанд, ки тамоми ин муддат вай се қадам аз онҳо пеш буд.'
        ),
        'word_dictionary': {
            'accusation': {'ru': 'обвинение', 'tg': 'айбдоркунӣ', 'lemma': 'accusation'},
            'severance package': {'ru': 'выходное пособие', 'tg': 'ҷуброни хизматӣ', 'lemma': 'severance package'},
            'grace': {'ru': 'достоинство, изящество', 'tg': 'шаъну шараф', 'lemma': 'grace'},
            'surrender': {'ru': 'капитуляция, сдача', 'tg': 'таслимшавӣ', 'lemma': 'surrender'},
            'methodically': {'ru': 'методично', 'tg': 'бо тартиб', 'lemma': 'methodically'},
            'clear (a name)': {'ru': 'очистить (имя)', 'tg': 'пок кардан (ном)', 'lemma': 'clear'},
        },
        'story_words': [
            ('accusation', 'noun', 'accusation'), ('grace', 'noun', 'grace'),
            ('surrender', 'noun', 'surrender'), ('methodically', 'adverb', 'methodically'),
        ],
        'questions': [
            ('What happened to the woman at her company?',
             'Что произошло с женщиной в её компании?',
             'Бо зан дар ширкаташ чӣ рӯй дод?',
             ['She was quietly let go with a severance package', 'She was promoted', 'She resigned publicly'],
             'She was quietly let go with a severance package',
             'The company let her go quietly, with a severance package and a request for silence.',
             'Компания тихо уволила её, с выходным пособием и просьбой молчать.',
             'Ширкат ӯро оҳиста бо ҷуброни хизматӣ ва хоҳиши хомӯшӣ аз кор озод кард.'),
            ('What did she actually do during the months of silence?',
             'Что она на самом деле делала в те месяцы молчания?',
             'Вай дар моҳҳои хомӯшӣ дар асл чӣ мекард?',
             ['Quietly gathered evidence to clear her name', 'Complained to journalists', 'Did nothing at all'],
             'Quietly gathered evidence to clear her name',
             'She spent those months quietly gathering evidence that would eventually clear her name.',
             'Она месяцами тихо собирала доказательства, которые в итоге очистили её имя.',
             'Вай моҳҳо ором далелҳоеро ҷамъ мекард, ки номи ӯро пок мекарданд.'),
            ('What did people in the corridors not realize about her?',
             'Чего не понимали о ней люди в коридорах?',
             'Одамон дар долонҳо дар бораи вай чиро намефаҳмиданд?',
             ['That she was three steps ahead of them', 'That she had already left the company', 'That she was planning to sue them'],
             'That she was three steps ahead of them',
             "'Little did they know... that she was three steps ahead of them the entire time.'",
             '«И не подозревали они... что всё это время она была на три шага впереди них».',
             '«Онҳо намедонистанд... ки тамоми ин муддат вай се қадам аз онҳо пеш буд».'),
        ],
    },
    {
        'title_en': 'Had I Only Known', 'title_ru': 'Знай я тогда', 'title_tg': 'Кошки медонистам',
        'genre': 'drama', 'grammar_topic': 'inversion in conditionals without if',
        'body_en': (
            'Had I only known how that evening would end, I would have said something different '
            'at the door.\n\n'
            'Had she told me the truth about the diagnosis then, I would have stayed. Instead '
            'she smiled, said everything was fine, and sent me off to my meeting like it was any '
            'ordinary Tuesday.\n\n'
            "Were she here now, I'd ask her why. Why carry something so heavy alone, on the one "
            'day she most needed someone beside her?\n\n'
            "Should anyone ever ask me what I regret most, I wouldn't have to think long. Not the "
            'missed meeting. Not the years since. Just that door, that smile, and the ten seconds '
            "I had to notice something was wrong — and didn't.\n\n"
            'Had I known, I would have stayed. But I didn\'t know, and by the time I did, it was '
            'already too late to matter.'
        ),
        'body_ru': (
            'Знай я тогда, чем закончится тот вечер, у двери я сказал бы что-то другое.\n\n'
            'Скажи она мне правду о диагнозе, я бы остался. Вместо этого она улыбнулась, сказала, что всё хорошо, и отправила меня на встречу, как будто это был обычный вторник.\n\n'
            'Будь она сейчас здесь, я бы спросил её — почему. Почему нести такую тяжесть в одиночку, именно в тот день, когда ей больше всего был нужен кто-то рядом?\n\n'
            'Спроси меня кто-нибудь, о чём я жалею больше всего, мне не пришлось бы долго думать. Не о пропущенной встрече. Не о прошедших с тех пор годах. Только о той двери, той улыбке и о десяти секундах, за которые я мог заметить, что что-то не так — и не заметил.\n\n'
            'Знай я тогда, я бы остался. Но я не знал, а когда узнал, было уже слишком поздно, чтобы это имело значение.'
        ),
        'body_tg': (
            'Агар он гоҳ медонистам, ки он бегоҳ чӣ гуна ба анҷом мерасад, дар назди дар чизи дигаре мегуфтам.\n\n'
            'Агар вай ба ман ҳақиқатро дар бораи ташхис мегуфт, мемондам. Ба ҷои он вай табассум кард, гуфт, ки ҳама чиз хуб аст, ва маро ба ҷаласаам фиристод, гӯё ин рӯзи сешанбеи муқаррарӣ буд.\n\n'
            'Агар вай ҳоло дар ин ҷо мебуд, аз вай мепурсидам — чаро? Чаро бори чунин вазнинро танҳо бардорад, маҳз дар рӯзе, ки ба вай беш аз ҳама касе дар паҳлӯяш лозим буд?\n\n'
            'Агар касе аз ман бипурсад, ки ман аз чӣ бештар афсӯс мехӯрам, лозим намеояд дер фикр кунам. На ҷаласаи аз даст рафта. На солҳои пас аз он. Танҳо он дар, он табассум ва даҳ сонияе, ки метавонистам пай барам, ки чизе дуруст нест — ва пай набурдам.\n\n'
            'Агар медонистам, мемондам. Аммо намедонистам, ва вақте ки фаҳмидам, дигар хеле дер шуда буд, ки аҳамият дошта бошад.'
        ),
        'word_dictionary': {
            'diagnosis': {'ru': 'диагноз', 'tg': 'ташхис', 'lemma': 'diagnosis'},
            'regret': {'ru': 'сожалеть, сожаление', 'tg': 'афсӯс хӯрдан', 'lemma': 'regret'},
            'notice': {'ru': 'замечать', 'tg': 'пай бурдан', 'lemma': 'notice'},
            'too late to matter': {'ru': 'слишком поздно, чтобы иметь значение', 'tg': 'хеле дер, ки аҳамият дошта бошад', 'lemma': 'too late'},
        },
        'story_words': [
            ('diagnosis', 'noun', 'diagnosis'), ('regret', 'verb', 'regret'),
            ('notice', 'verb', 'notice'),
        ],
        'questions': [
            ('What did the woman actually tell the narrator that morning?',
             'Что женщина на самом деле сказала рассказчику тем утром?',
             'Зан он субҳ ба ровӣ дар асл чӣ гуфт?',
             ['That everything was fine', 'The truth about her diagnosis', 'That she needed him to stay'],
             'That everything was fine',
             'She smiled and said everything was fine, sending him off to his meeting.',
             'Она улыбнулась и сказала, что всё хорошо, отправив его на встречу.',
             'Вай табассум кард ва гуфт, ки ҳама чиз хуб аст, ва ӯро ба ҷаласа фиристод.'),
            ('What does the narrator say he regrets most?',
             'О чём рассказчик говорит, что жалеет больше всего?',
             'Ровӣ мегӯяд, ки аз чӣ бештар афсӯс мехӯрад?',
             ['Not noticing something was wrong at the door', 'Missing the meeting', 'Arguing with her'], 'Not noticing something was wrong at the door',
             'He regrets the ten seconds he had to notice something was wrong and did not.',
             'Он сожалеет о тех десяти секундах, когда мог заметить неладное, но не заметил.',
             'Ӯ аз он даҳ сония, ки метавонист пай барад, вале набурд, афсӯс мехӯрад.'),
            ('When did the narrator finally understand the truth?',
             'Когда рассказчик наконец понял правду?',
             'Ровӣ ниҳоят ҳақиқатро кай фаҳмид?',
             ['Too late for it to matter', 'Immediately, at the door', 'The next morning'],
             'Too late for it to matter',
             "By the time he understood, 'it was already too late to matter.'",
             'К тому времени, как он понял, «было уже слишком поздно, чтобы это имело значение».',
             'Вақте ки ӯ фаҳмид, «дигар хеле дер шуда буд, ки аҳамият дошта бошад».'),
        ],
    },
    {
        'title_en': 'Two Ways of Saying the Same Thing', 'title_ru': 'Два способа сказать одно и то же', 'title_tg': 'Ду роҳи гуфтани як чиз',
        'genre': 'satire', 'grammar_topic': 'register: formal vs informal grammar choices',
        'body_en': (
            'The official complaint read: "The undersigned wishes to formally register her '
            'profound dissatisfaction regarding the persistent and, as yet, unresolved issue of '
            'excessive noise emanating from the adjacent property during nocturnal hours."\n\n'
            'What she\'d actually said to her husband that morning was: "Tell them to shut up, '
            'or I swear I\'m calling the council."\n\n'
            'Two versions of the same sentence, aimed at two different audiences — one for the '
            'record, one for the kitchen table.\n\n'
            'The council\'s reply, weeks later, was equally split in tone. Officially: "We '
            'appreciate you bringing this matter to our attention and will investigate '
            'accordingly." Unofficially, the clerk who called her muttered, "Honestly, love, '
            'everyone on that street\'s complained about them. We\'re onto it."\n\n'
            "She hung up satisfied, though she couldn't have said which version — the formal or "
            'the human one — had actually reassured her. Perhaps it was neither. Perhaps it was '
            'simply being heard, however the words were dressed.'
        ),
        'body_ru': (
            'Официальная жалоба гласила: «Нижеподписавшаяся желает официально зафиксировать своё глубокое недовольство по поводу постоянной и до сих пор не решённой проблемы чрезмерного шума, исходящего из соседнего дома в ночное время».\n\n'
            'А вот что она на самом деле сказала мужу тем утром: «Скажи им заткнуться, или, клянусь, я звоню в муниципалитет».\n\n'
            'Два варианта одной и той же мысли, обращённые к разной аудитории — один для протокола, другой для кухонного стола.\n\n'
            'Ответ муниципалитета, пришедший недели спустя, был выдержан в столь же раздвоенном тоне. Официально: «Благодарим вас за то, что довели этот вопрос до нашего сведения, и проведём соответствующее расследование». Неофициально клерк, позвонившая ей, пробормотала: «Честно говоря, милая, на эту семью жалуется вся улица. Мы уже занимаемся этим».\n\n'
            'Она повесила трубку удовлетворённой, хотя и не смогла бы сказать, какая версия — официальная или человеческая — её на самом деле успокоила. Возможно, ни та, ни другая. Возможно, дело было просто в том, что её услышали, как бы ни были обёрнуты слова.'
        ),
        'body_tg': (
            'Шикояти расмӣ чунин навишта шуда буд: «Имзокунандаи зерин мехоҳад расман норозигии амиқи худро дар бораи мушкилоти доимӣ ва то ҳол ҳалнашудаи садои зиёдатӣ, ки аз хонаи ҳамсоягӣ дар соатҳои шабона мебарояд, қайд кунад».\n\n'
            'Он чи вай дар асл он субҳ ба шавҳараш гуфта буд, ин буд: «Гӯй, ки хомӯш шаванд, вагарна, қасам мехӯрам, ба шаҳрдорӣ занг мезанам».\n\n'
            'Ду шакли як фикр, ба ду шунавандаи гуногун равона шуда — яке барои протокол, дигаре барои мизи ошхона.\n\n'
            'Ҷавоби шаҳрдорӣ, ки баъд аз якчанд ҳафта омад, низ бо ҳамин оҳанги дугона буд. Расман: «Аз он ки ин масъаларо ба мо расонидед, миннатдорем ва тафтиши дахлдорро анҷом медиҳем». Ғайрирасмӣ, коргузоре ки ба вай занг зад, гуфт: «Ростӣ, азизам, тамоми кӯча аз онҳо шикоят кардааст. Мо аллакай кор карда истодаем».\n\n'
            'Вай гӯшакро бо қаноатмандӣ гузошт, гарчанде наметавонист бигӯяд, ки кадом нусха — расмӣ ё инсонӣ — воқеан ӯро ором кард. Шояд ҳеҷ кадомаш набуд. Шояд танҳо шунида шудан буд, новобаста аз он ки калимаҳо чӣ тавр либос пӯшонида шуданд.'
        ),
        'word_dictionary': {
            'undersigned': {'ru': 'нижеподписавшийся', 'tg': 'имзокунандаи зерин', 'lemma': 'undersigned'},
            'dissatisfaction': {'ru': 'недовольство', 'tg': 'норозигӣ', 'lemma': 'dissatisfaction'},
            'nocturnal': {'ru': 'ночной', 'tg': 'шабона', 'lemma': 'nocturnal'},
            'council': {'ru': 'муниципалитет', 'tg': 'шаҳрдорӣ', 'lemma': 'council'},
            'clerk': {'ru': 'клерк, служащий', 'tg': 'коргузор', 'lemma': 'clerk'},
            'reassure': {'ru': 'успокаивать', 'tg': 'ором кардан', 'lemma': 'reassure'},
        },
        'story_words': [
            ('dissatisfaction', 'noun', 'dissatisfaction'), ('nocturnal', 'adjective', 'nocturnal'),
            ('council', 'noun', 'council'), ('reassure', 'verb', 'reassure'),
        ],
        'questions': [
            ('What did the woman actually say to her husband that morning?',
             'Что женщина на самом деле сказала мужу тем утром?',
             'Зан он субҳ дар асл ба шавҳараш чӣ гуфт?',
             ['Tell them to shut up, or I will call the council', 'I will write a formal complaint', 'Let it go, it is not important'],
             'Tell them to shut up, or I will call the council',
             "She told her husband: 'Tell them to shut up, or I swear I'm calling the council.'",
             'Она сказала мужу: «Скажи им заткнуться, или, клянусь, я звоню в муниципалитет».',
             'Вай ба шавҳараш гуфт: «Гӯй, ки хомӯш шаванд, вагарна ба шаҳрдорӣ занг мезанам».'),
            ("What did the clerk say unofficially, compared to the official letter?",
             'Что клерк сказала неофициально, в отличие от официального письма?',
             'Коргузор ғайрирасмӣ дар муқоиса бо номаи расмӣ чӣ гуфт?',
             ['That the whole street had complained about the neighbours', 'That nothing could be done', 'That the woman should move house'],
             'That the whole street had complained about the neighbours',
             "Unofficially, the clerk said 'everyone on that street's complained about them.'",
             'Неофициально клерк сказала: «на эту семью жалуется вся улица».',
             'Ғайрирасмӣ коргузор гуфт: «тамоми кӯча аз онҳо шикоят кардааст».'),
            ('What does the narrator suggest actually satisfied the woman?',
             'Что, по мнению рассказчика, на самом деле удовлетворило женщину?',
             'Ровӣ пешниҳод мекунад, ки занро дар асл чӣ қаноатманд кард?',
             ['Simply being heard, regardless of the wording', 'The formal legal language', 'Getting an immediate solution'],
             'Simply being heard, regardless of the wording',
             'The narrator suggests it was simply being heard, however the words were dressed.',
             'Рассказчик предполагает, что дело было просто в том, что её услышали, как бы ни были поданы слова.',
             'Ровӣ пешниҳод мекунад, ки танҳо шунида шудан буд, новобаста аз шакли калимаҳо.'),
        ],
    },
]


async def seed_stories(db):
    created = 0
    skipped = 0

    for idx, item in enumerate(STORIES, start=4):
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
