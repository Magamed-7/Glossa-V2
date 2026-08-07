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

        # 3. Create Services
        services_data = [
            {
                'provider_id': providers['Ji-Yoon K.'].id,
                'title': 'TOPIK Exam Preparation',
                'description': 'Intensive coaching for TOPIK II levels 3–6. Focus on writing and reading comprehension.',
                'category': 'KOREAN',
                'cefr_level': 'B2',
                'price': Decimal('60.00'),
                'pricing_type': 'hr',
                'status': 'active',
                'rating': Decimal('4.80'),
                'reviews_count': 12
            },
            {
                'provider_id': providers['Elena Rossi'].id,
                'title': 'Italian Business Document Translation',
                'description': 'Professional translation of legal contracts, financial audits, and business presentations from English to Italian.',
                'category': 'TRANSLATION',
                'cefr_level': 'C1',
                'price': Decimal('0.15'),
                'pricing_type': 'word',
                'status': 'active',
                'rating': Decimal('4.90'),
                'reviews_count': 34
            },
            {
                'provider_id': providers['Marc Dubois'].id,
                'title': 'Conversational French Tutoring (Pack of 5)',
                'description': 'Improve your speaking fluency and pronunciation through guided real-world topics. Perfect for intermediate speakers.',
                'category': 'FRENCH',
                'cefr_level': 'B1',
                'price': Decimal('120.00'),
                'pricing_type': 'hr',
                'status': 'active',
                'rating': Decimal('4.70'),
                'reviews_count': 19
            },
            {
                'provider_id': providers['Carlos S.'].id,
                'title': 'Spanish for Beginners',
                'description': 'Learn fundamental vocabulary and grammar rules. Focused on practical conversational situations.',
                'category': 'SPANISH',
                'cefr_level': 'A1',
                'price': Decimal('45.00'),
                'pricing_type': 'hr',
                'status': 'active',
                'rating': Decimal('4.60'),
                'reviews_count': 8
            },
            {
                'provider_id': providers['Bahriddin A.'].id,
                'title': 'Tajik Syntax & Structure',
                'description': 'Explore complex grammatical structures and morphology in Tajik. Suited for advanced linguists.',
                'category': 'TRANSLATION',
                'cefr_level': 'B1',
                'price': Decimal('50.00'),
                'pricing_type': 'hr',
                'status': 'active',
                'rating': Decimal('4.90'),
                'reviews_count': 22
            },
            {
                'provider_id': providers['Global Tech Inc.'].id,
                'title': 'Localization QA Testing',
                'description': 'QA audit, localization review, and software interface proofreading across European languages.',
                'category': 'EDITING',
                'cefr_level': 'C2',
                'price': Decimal('0.10'),
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

        svc_ital = next(s for s in services if s.title == 'Italian Business Document Translation')
        svc_french = next(s for s in services if s.title == 'Conversational French Tutoring (Pack of 5)')
        svc_qa = next(s for s in services if s.title == 'Localization QA Testing')

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
                status='pending'
            )
            db.add(prop_ital)
            await db.commit()
            await db.refresh(prop_ital)

            messages_ital = [
                LingoMessages(proposal_id=prop_ital.id, sender_id=providers['Elena Rossi'].id, text="Здравствуйте! Я изучила ваши юридические документы. Перевод займет около 3 дней."),
                LingoMessages(proposal_id=prop_ital.id, sender_id=client.id, text="Отлично! Какая будет итоговая стоимость?"),
                LingoMessages(proposal_id=prop_ital.id, sender_id=providers['Elena Rossi'].id, text="Я выставила предложение на 150 TJS за весь пакет. Можете подтвердить и оплатить здесь."),
            ]
            db.add_all(messages_ital)

            # Create Proposal 2 (Marc Dubois - active)
            prop_french = LingoProposals(
                client_id=client.id,
                provider_id=providers['Marc Dubois'].id,
                service_id=svc_french.id,
                price=Decimal('120.00'),
                status='active'
            )
            db.add(prop_french)
            await db.commit()
            await db.refresh(prop_french)

            messages_french = [
                LingoMessages(proposal_id=prop_french.id, sender_id=client.id, text="Привет, Марк! Я хотел бы забронировать пакет из 5 разговорных занятий."),
                LingoMessages(proposal_id=prop_french.id, sender_id=providers['Marc Dubois'].id, text="Bonjour! Рад слышать. В какое время вам удобно заниматься?"),
                LingoMessages(proposal_id=prop_french.id, sender_id=client.id, text="Предлагаю в 4 PM CET по вторникам."),
                LingoMessages(proposal_id=prop_french.id, sender_id=providers['Marc Dubois'].id, text="Отлично подходит! Условия подтверждены, жду вас на первом уроке!"),
            ]
            db.add_all(messages_french)

            # Create Proposal 3 (Global Tech Inc. - completed)
            prop_qa = LingoProposals(
                client_id=client.id,
                provider_id=providers['Global Tech Inc.'].id,
                service_id=svc_qa.id,
                price=Decimal('300.00'),
                status='completed'
            )
            db.add(prop_qa)
            await db.commit()
            await db.refresh(prop_qa)

            messages_qa = [
                LingoMessages(proposal_id=prop_qa.id, sender_id=providers['Global Tech Inc.'].id, text="Мы закончили тестирование локализации вашего приложения. Отчет прикреплен."),
                LingoMessages(proposal_id=prop_qa.id, sender_id=client.id, text="Спасибо за быструю работу, все выглядит отлично!"),
                LingoMessages(proposal_id=prop_qa.id, sender_id=providers['Global Tech Inc.'].id, text="Рады были помочь! Инвойс #4402 оплачен. Удачи в релизе!"),
            ]
            db.add_all(messages_qa)

            await db.commit()
        
        print("Lingo database seeding completed successfully without registering new users!")

if __name__ == '__main__':
    asyncio.run(seed())
