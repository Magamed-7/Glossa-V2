import asyncio
import sys
from pathlib import Path
from decimal import Decimal
from datetime import datetime

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select, delete, update
from app.db.database import AsyncSessionLocal
from app.models.model_user import Users
from app.models.model_lingo import LingoServices, LingoProposals, LingoMessages
from app.models.model_payment import UserBalances

PROVIDER_MAPPING = {
    729: ('Ji-Yoon K.', 'jiyoon@glossa.com'),
    634: ('Elena Rossi', 'elena@glossa.com'),
    635: ('Marc Dubois', 'marc@glossa.com'),
    636: ('Carlos S.', 'carlos@glossa.com'),
    730: ('Bahriddin A.', 'bahriddin@glossa.com'),
    733: ('Global Tech Inc.', 'globaltech@glossa.com'),
}

async def seed():
    async with AsyncSessionLocal() as db:
        # 1. Clear existing marketplace tables to prevent duplicates
        await db.execute(delete(LingoMessages))
        await db.execute(delete(LingoProposals))
        await db.execute(delete(LingoServices))
        await db.commit()

        # 2. Setup providers by updating existing user IDs
        providers = {}
        for uid, (uname, email) in PROVIDER_MAPPING.items():
            # Check if user exists
            res = await db.execute(select(Users).where(Users.id == uid))
            user = res.scalar_one_or_none()
            if user:
                user.username = uname
                user.email = email
                user.is_verified = True
                await db.commit()
                providers[uname] = user
            else:
                # Fallback: if not found, find by username or first available non-client user
                fallback_res = await db.execute(select(Users).where(Users.username == uname))
                user = fallback_res.scalar_one_or_none()
                if not user:
                    # Let's find any user that is not a main tester
                    user_candidates = await db.execute(
                        select(Users).where(Users.id != 822).where(Users.id != 683).order_by(Users.id.desc())
                    )
                    user = user_candidates.scalars().first()
                if user:
                    user.username = uname
                    user.email = email
                    user.is_verified = True
                    await db.commit()
                    providers[uname] = user

        # Ensure we have all providers (if some mappings were missing or database is empty)
        for uname, email in [('Ji-Yoon K.', 'jiyoon@glossa.com'), ('Elena Rossi', 'elena@glossa.com'), 
                             ('Marc Dubois', 'marc@glossa.com'), ('Carlos S.', 'carlos@glossa.com'), 
                             ('Bahriddin A.', 'bahriddin@glossa.com'), ('Global Tech Inc.', 'globaltech@glossa.com')]:
            if uname not in providers:
                # Find any user that isn't already mapped
                mapped_ids = [p.id for p in providers.values()]
                avail_res = await db.execute(
                    select(Users).where(~Users.id.in_(mapped_ids + [822, 683])).order_by(Users.id.asc())
                )
                user = avail_res.scalars().first()
                if user:
                    user.username = uname
                    user.email = email
                    user.is_verified = True
                    await db.commit()
                    providers[uname] = user

        # Ensure balances for providers
        for prov in providers.values():
            p_bal = await db.execute(select(UserBalances).where(UserBalances.user_id == prov.id))
            if p_bal.scalar_one_or_none() is None:
                db.add(UserBalances(user_id=prov.id, balance=Decimal('0.00')))
                await db.commit()

        # 3. Create Services matching the 3 languages studied + translation + editing, levels and multiple currencies
        services_data = [
            {
                'provider_id': providers['Ji-Yoon K.'].id,
                'title': 'English IELTS Preparation (up to C1)',
                'description': 'Targeted study to get you to C1 level. Speaking drills and writing reviews included.',
                'title_en': 'English IELTS Preparation (up to C1)',
                'title_ru': 'Подготовка к IELTS (до уровня C1)',
                'title_tg': 'Омодагӣ ба IELTS (то сатҳи C1)',
                'description_en': 'Targeted study to get you to C1 level. Speaking drills and writing reviews included.',
                'description_ru': 'Целевое обучение для достижения уровня C1. Разговорная практика и анализ эссе включены.',
                'description_tg': 'Омӯзиши мақсаднок барои расидан ба сатҳи C1. Практикаи гуфтугӯӣ ва баррасии эссеро дар бар мегирад.',
                'category': 'ENGLISH',
                'cefr_level': 'C1',
                'price': Decimal('15.00'),
                'currency': 'USD',
                'pricing_type': 'hr',
                'status': 'active',
                'rating': Decimal('4.80'),
                'reviews_count': 12
            },
            {
                'provider_id': providers['Elena Rossi'].id,
                'title': 'Russian Language for Beginners (A1-A2 only)',
                'description': 'Learn Russian from scratch up to A2. We will cover basic conversation and grammar.',
                'title_en': 'Russian Language for Beginners (A1-A2 only)',
                'title_ru': 'Русский язык для начинающих (только A1-A2)',
                'title_tg': 'Забони русӣ барои навомӯзон (танҳо A1-A2)',
                'description_en': 'Learn Russian from scratch up to A2. We will cover basic conversation and grammar.',
                'description_ru': 'Изучение русского языка с нуля до уровня A2. Разберем базовый диалог и основы грамматики.',
                'description_tg': 'Омӯзиши забони русӣ аз сифр то сатҳи A2. Мо муколамаҳои асосӣ ва асосҳои грамматикаро меомӯзем.',
                'category': 'RUSSIAN',
                'cefr_level': 'A2',
                'price': Decimal('120.00'),
                'currency': 'TJS',
                'pricing_type': 'hr',
                'status': 'active',
                'rating': Decimal('4.90'),
                'reviews_count': 34
            },
            {
                'provider_id': providers['Marc Dubois'].id,
                'title': 'Advanced Tajik Conversation & Grammar (B2-C1)',
                'description': 'Master complex morphology and speak Tajik like a native speaker. Focus on syntax and style.',
                'title_en': 'Advanced Tajik Conversation & Grammar (B2-C1)',
                'title_ru': 'Продвинутый таджикский язык: грамматика и разговор (B2-C1)',
                'title_tg': 'Забони тоҷикии пешрафта: грамматика ва гуфтугӯ (B2-C1)',
                'description_en': 'Master complex morphology and speak Tajik like a native speaker. Focus on syntax and style.',
                'description_ru': 'Освойте сложную морфологию и говорите на таджикском как носитель. Упор на синтаксис и стиль.',
                'description_tg': 'Морфологияи мураккабро аз худ кунед ва бо забони тоҷикӣ мисли як сокини маҳаллӣ сӯҳбат кунед. Таваҷҷӯҳ ба синтаксис ва услуб.',
                'category': 'TAJIK',
                'cefr_level': 'C1',
                'price': Decimal('800.00'),
                'currency': 'RUB',
                'pricing_type': 'hr',
                'status': 'active',
                'rating': Decimal('4.70'),
                'reviews_count': 19
            },
            {
                'provider_id': providers['Carlos S.'].id,
                'title': 'English-Russian-Tajik Document Translation (up to C2)',
                'description': 'Professional business, legal and technical translation between English, Russian and Tajik.',
                'title_en': 'English-Russian-Tajik Document Translation (up to C2)',
                'title_ru': 'Профессиональный перевод: английский, русский, таджикский (до C2)',
                'title_tg': 'Тарҷумаи ҳуҷҷатҳои англисӣ-русӣ-тоҷикӣ (то сатҳи C2)',
                'description_en': 'Professional business, legal and technical translation between English, Russian and Tajik.',
                'description_ru': 'Профессиональный перевод деловой, юридической и технической документации между английским, русским и таджикским.',
                'description_tg': 'Тарҷумаи касбии тиҷоратӣ, ҳуқуқӣ ва техникии байни забонҳои англисӣ, русӣ ва тоҷикӣ.',
                'category': 'TRANSLATION',
                'cefr_level': 'C2',
                'price': Decimal('0.05'),
                'currency': 'USD',
                'pricing_type': 'word',
                'status': 'active',
                'rating': Decimal('4.60'),
                'reviews_count': 8
            },
            {
                'provider_id': providers['Bahriddin A.'].id,
                'title': 'Tajik Essay Proofreading (only B2-C2)',
                'description': 'Thorough spelling, punctuation and grammar verification of academic papers and books in Tajik.',
                'title_en': 'Tajik Essay Proofreading (only B2-C2)',
                'title_ru': 'Корректура текстов на таджикском (только B2-C2)',
                'title_tg': 'Ислоҳи матнҳо бо забони тоҷикӣ (танҳо B2-C2)',
                'description_en': 'Thorough spelling, punctuation and grammar verification of academic papers and books in Tajik.',
                'description_ru': 'Тщательная проверка орфографии, пунктуации и грамматики академических работ и книг на таджикском языке.',
                'description_tg': 'Санҷиши дақиқи имло, китобат ва грамматикаи корҳои академӣ ва китобҳо бо забони тоҷикӣ.',
                'category': 'EDITING',
                'cefr_level': 'C1',
                'price': Decimal('30.00'),
                'currency': 'TJS',
                'pricing_type': 'hr',
                'status': 'active',
                'rating': Decimal('4.90'),
                'reviews_count': 22
            },
            {
                'provider_id': providers['Global Tech Inc.'].id,
                'title': 'Web Interface Localization & Editing',
                'description': 'QA review, interface copy translations, and localization testing across Russian, Tajik and English.',
                'title_en': 'Web Interface Localization & Editing',
                'title_ru': 'Локализация и редактура веб-интерфейсов',
                'title_tg': 'Локализатсия ва таҳрири веб-интерфейсҳо',
                'description_en': 'QA review, interface copy translations, and localization testing across Russian, Tajik and English.',
                'description_ru': 'Проверка качества, перевод элементов интерфейса и тестирование локализации на русском, таджикском и английском.',
                'description_tg': 'Санҷиши сифат, тарҷумаи унсурҳои интерфейс ва санҷиши локализатсия бо забонҳои русӣ, тоҷикӣ ва англисӣ.',
                'category': 'EDITING',
                'cefr_level': 'C2',
                'price': Decimal('1.20'),
                'currency': 'USD',
                'pricing_type': 'word',
                'status': 'active',
                'rating': Decimal('5.00'),
                'reviews_count': 41
            }
        ]

        services = []
        for s_data in services_data:
            svc = LingoServices(**s_data)
            db.add(svc)
            services.append(svc)
        await db.commit()
        for svc in services:
            await db.refresh(svc)

        # 4. Identify client users to attach proposals to (Magamedjan and testuser)
        client_candidates = []
        for cid in [683, 822]:
            c_res = await db.execute(select(Users).where(Users.id == cid))
            client_user = c_res.scalar_one_or_none()
            if client_user:
                client_candidates.append(client_user)

        # Fallback to first user in database if none of them found
        if not client_candidates:
            first_user_res = await db.execute(select(Users).order_by(Users.id.asc()))
            first_user = first_user_res.scalars().first()
            if first_user:
                client_candidates.append(first_user)

        svc_ital = next(s for s in services if s.category == 'RUSSIAN')
        svc_french = next(s for s in services if s.category == 'TAJIK')
        svc_qa = next(s for s in services if s.title == 'Web Interface Localization & Editing')

        for client in client_candidates:
            # Ensure client has balance
            balance_result = await db.execute(select(UserBalances).where(UserBalances.user_id == client.id))
            user_balance = balance_result.scalar_one_or_none()
            if not user_balance:
                db.add(UserBalances(user_id=client.id, balance=Decimal('1000.00')))
            else:
                user_balance.balance = Decimal('1000.00')
            await db.commit()

            # Create Proposal 1 (Elena Rossi - pending)
            prop_ital = LingoProposals(
                client_id=client.id,
                provider_id=providers['Elena Rossi'].id,
                service_id=svc_ital.id,
                price=Decimal('150.00'),
                currency='TJS',
                status='pending'
            )
            db.add(prop_ital)
            await db.commit()
            await db.refresh(prop_ital)

            messages_ital = [
                LingoMessages(proposal_id=prop_ital.id, sender_id=providers['Elena Rossi'].id, text="Здравствуйте! Я готова помочь вам изучить русский язык до уровня A2. Первое занятие можно провести уже завтра."),
                LingoMessages(proposal_id=prop_ital.id, sender_id=client.id, text="Отлично! Какая будет итоговая стоимость занятий?"),
                LingoMessages(proposal_id=prop_ital.id, sender_id=providers['Elena Rossi'].id, text="Я выставила предложение на 150 TJS за базовый вводный курс. Можете подтвердить и оплатить здесь."),
            ]
            db.add_all(messages_ital)

            # Create Proposal 2 (Marc Dubois - active)
            prop_french = LingoProposals(
                client_id=client.id,
                provider_id=providers['Marc Dubois'].id,
                service_id=svc_french.id,
                price=Decimal('120.00'),
                currency='RUB',
                status='active'
            )
            db.add(prop_french)
            await db.commit()
            await db.refresh(prop_french)

            messages_french = [
                LingoMessages(proposal_id=prop_french.id, sender_id=client.id, text="Привет, Марк! Я хотел бы повысить свой таджикский язык до C1. Поможешь с синтаксисом?"),
                LingoMessages(proposal_id=prop_french.id, sender_id=providers['Marc Dubois'].id, text="Салом! Конечно, с радостью. Будем делать упор на сложные конструкции и тексты. В какое время вам удобно заниматься?"),
                LingoMessages(proposal_id=prop_french.id, sender_id=client.id, text="Давай во вторник в 16:00."),
                LingoMessages(proposal_id=prop_french.id, sender_id=providers['Marc Dubois'].id, text="Договорились! Я подтвердил занятие, жду встречи!"),
            ]
            db.add_all(messages_french)

            # Create Proposal 3 (Global Tech Inc. - completed)
            prop_qa = LingoProposals(
                client_id=client.id,
                provider_id=providers['Global Tech Inc.'].id,
                service_id=svc_qa.id,
                price=Decimal('300.00'),
                currency='USD',
                status='completed'
            )
            db.add(prop_qa)
            await db.commit()
            await db.refresh(prop_qa)

            messages_qa = [
                LingoMessages(proposal_id=prop_qa.id, sender_id=providers['Global Tech Inc.'].id, text="Мы завершили аудит и редактуру локализации вашего веб-интерфейса. Все тексты приведены в соответствие."),
                LingoMessages(proposal_id=prop_qa.id, sender_id=client.id, text="Большое спасибо, всё проверил, перевод выглядит очень естественно!"),
                LingoMessages(proposal_id=prop_qa.id, sender_id=providers['Global Tech Inc.'].id, text="Рады сотрудничеству! Работа завершена и оплачена."),
            ]
            db.add_all(messages_qa)

            await db.commit()
        
        print("Lingo database seeding completed successfully with English, Russian, Tajik and multi-currency!")

if __name__ == '__main__':
    asyncio.run(seed())
