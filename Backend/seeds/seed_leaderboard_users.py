import asyncio
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select, text

from app.db.database import AsyncSessionLocal
from app.models.model_profile import ProfilePrivacy, UserProfiles
from app.models.model_rating import XpTransactions
from app.models.model_settings import UserSettings
from app.services import ratings
from app.core.redis_client import redis_client

NAMES = [
    # Tajik names
    ('farrukh_tj', 'Farrukh', 'Karimov'),
    ('sitora_99', 'Sitora', 'Rahimova'),
    ('dilshod_tj', 'Dilshod', 'Sharipov'),
    ('anisa_r', 'Anisa', 'Rustamova'),
    ('khurshed_k', 'Khurshed', 'Kamolov'),
    ('mavzuna_sh', 'Mavzuna', 'Shukurova'),
    ('rustam_tj', 'Rustam', 'Hakimov'),
    ('parvina_n', 'Parvina', 'Nazarova'),
    ('jamshed_b', 'Jamshed', 'Boboev'),
    ('shohin_tj', 'Shohin', 'Safarov'),
    ('firuza_k', 'Firuza', 'Kadyrova'),
    ('bakhtiyor_s', 'Bakhtiyor', 'Saidov'),
    ('zarina_m', 'Zarina', 'Mirzoeva'),
    ('zafar_h', 'Zafar', 'Hamidov'),
    ('davron_tj', 'Davron', 'Tursunov'),
    ('laylo_tj', 'Laylo', 'Umarova'),
    ('tahmina_m', 'Tahmina', 'Madaminova'),
    ('sobir_tj', 'Sobir', 'Gafurov'),
    ('alisher_tj', 'Alisher', 'Vahobov'),
    ('bahrom_tj', 'Bahrom', 'Rahmonov'),
    ('manizha_tj', 'Manizha', 'Azizova'),
    ('mehrdod_tj', 'Mehrdod', 'Yoqubov'),
    ('nozim_tj', 'Nozim', 'Salimov'),
    ('nodira_tj', 'Nodira', 'Aslanova'),
    ('shodi_tj', 'Shodi', 'Fayzov'),
    ('firuz_tj', 'Firuz', 'Ahmadov'),
    ('zarrina_tj', 'Zarrina', 'Odinaeva'),
    ('ismoil_tj', 'Ismoil', 'Samadi'),
    # Russian names
    ('ivan_ru', 'Иван', 'Иванов'),
    ('olga_smirnova', 'Ольга', 'Смирнова'),
    ('dmitry_petrov', 'Дмитрий', 'Петров'),
    ('svetlana_k', 'Светлана', 'Кузнецова'),
    ('sergey_volkov', 'Сергей', 'Волков'),
    ('elena_popova', 'Елена', 'Попова'),
    ('maria_sokolova', 'Мария', 'Соколова'),
    ('andrey_lebedev', 'Андрей', 'Лебедев'),
    ('anna_kozlova', 'Анна', 'Козлова'),
    ('pavel_novikov', 'Павел', 'Новиков'),
    ('tatiana_morozova', 'Татьяна', 'Морозова'),
    ('artem_solovyov', 'Артём', 'Соловьёв'),
    ('natalia_f', 'Наталья', 'Фёдорова'),
    ('maxim_k', 'Максим', 'Ковалёв'),
    ('irina_b', 'Ирина', 'Баранова'),
    ('nikita_ru', 'Никита', 'Павлов'),
    ('yulia_ru', 'Юлия', 'Семёнова'),
    ('egor_ru', 'Егор', 'Голубев'),
    ('marina_ru', 'Марина', 'Виноградова'),
    ('kirill_ru', 'Кирилл', 'Богданов'),
    ('daria_ru', 'Дарья', 'Воробьёва'),
    ('anton_ru', 'Антон', 'Семёнов'),
    ('victoria_ru', 'Виктория', 'Фролова'),
    ('roman_ru', 'Роман', 'Романов'),
    ('elizabeth_ru', 'Елизавета', 'Кудрявцева'),
    ('sofia_ru', 'София', 'Александрова'),
    ('danil_ru', 'Данил', 'Королёв'),
    ('alex_ru', 'Алексей', 'Михайлов'),
    # English names
    ('john_doe', 'John', 'Doe'),
    ('emily_smith', 'Emily', 'Smith'),
    ('michael_jones', 'Michael', 'Jones'),
    ('sarah_miller', 'Sarah', 'Miller'),
    ('david_d', 'David', 'Davis'),
    ('jessica_g', 'Jessica', 'Garcia'),
    ('james_r', 'James', 'Rodriguez'),
    ('ashley_w', 'Ashley', 'Wilson'),
    ('robert_m', 'Robert', 'Martinez'),
    ('amanda_a', 'Amanda', 'Anderson'),
    ('william_t', 'William', 'Taylor'),
    ('megan_t', 'Megan', 'Thomas'),
    ('richard_h', 'Richard', 'Hernandez'),
    ('heather_m', 'Heather', 'Moore'),
    ('joseph_m', 'Joseph', 'Martin'),
    ('lisa_j', 'Lisa', 'Jackson'),
    ('charles_t', 'Charles', 'Thompson'),
    ('stephanie_w', 'Stephanie', 'White'),
    ('thomas_l', 'Thomas', 'Lopez'),
    ('melissa_l', 'Melissa', 'Lee'),
    ('daniel_g', 'Daniel', 'Gonzalez'),
    ('jennifer_h', 'Jennifer', 'Harris'),
    ('matthew_c', 'Matthew', 'Clark'),
    ('elizabeth_l', 'Elizabeth', 'Lewis'),
    ('andrew_r', 'Andrew', 'Robinson'),
    ('samantha_w', 'Samantha', 'Walker'),
    ('joshua_p', 'Joshua', 'Perez'),
    ('helen_k', 'Helen', 'King'),
    ('mark_w', 'Mark', 'Wright'),
    ('laura_l', 'Laura', 'Long'),
]

async def seed():
    # Build a pool of 46 unique avatars: 26 copied desktop wallpapers, 5 generated, 15 existing defaults
    pool = []
    for idx in range(1, 27):
        pool.append(f"/img/avatars/desktop_{idx}.jpg")
    for idx in range(1, 6):
        pool.append(f"/img/avatars/gen_{idx}.png")
    existing_defaults = [
        "academic-curious.webp", "academic-silver.webp", "archivist-glasses.webp",
        "archivist-monocle.webp", "archivist-suit.webp", "creative-glasses.webp",
        "learner-cheerful.webp", "learner-confident.webp", "learner-focused.webp",
        "linguist-bw.webp", "scholar-coat.webp", "scholar-hornrim.webp",
        "scholar-lamp.webp", "scholar-turtleneck.webp", "student-studio.webp"
    ]
    for name in existing_defaults:
        pool.append(f"/img/avatars/{name}")

    async with AsyncSessionLocal() as db:
        print("Starting user seed for leaderboards...")
        for username, first_name, last_name in NAMES:
            # Deterministic index for the user's avatar
            hash_idx = sum(ord(char) for char in username) % len(pool)
            avatar_url = pool[hash_idx]

            # 1. Check if user already exists in `users`
            existing = await db.execute(
                text("select id from users where username = :username"),
                {"username": username}
            )
            row = existing.fetchone()
            
            if row:
                user_id = row[0]
                print(f"User {username} already exists with ID {user_id}. Skipping creation.")
            else:
                # Insert into users
                res = await db.execute(
                    text("""
                        insert into users (
                            username, email, password, role, is_verified, is_active,
                            is_staff, is_superuser, is_2fa_enabled, date_joined, created_at,
                            first_name, last_name
                        ) values (
                            :username, :email, '', 'student', true, true,
                            false, false, false, now(), now(),
                            :first_name, :last_name
                        ) returning id
                    """),
                    {
                        "username": username,
                        "email": f"{username}@example.com",
                        "first_name": first_name,
                        "last_name": last_name
                    }
                )
                user_id = res.fetchone()[0]
                await db.commit()
                print(f"Created user {username} with ID {user_id}.")

            # 2. Check and create UserProfiles, UserSettings, ProfilePrivacy, UserBalances
            profile_exists = (await db.execute(
                text("select id from user_profiles where user_id = :uid"), {"uid": user_id}
            )).fetchone()
            if not profile_exists:
                db.add(UserProfiles(user_id=user_id, bio=f"Hello, I am {first_name}! Let's learn languages.", photo_url=avatar_url))
            else:
                await db.execute(
                    text("update user_profiles set photo_url = :photo_url where user_id = :uid"),
                    {"photo_url": avatar_url, "uid": user_id}
                )
            
            settings_exists = (await db.execute(
                text("select id from user_settings where user_id = :uid"), {"uid": user_id}
            )).fetchone()
            if not settings_exists:
                db.add(UserSettings(user_id=user_id, ratings_enabled=True, interface_language=random.choice(['en', 'ru', 'tg'])))

            privacy_exists = (await db.execute(
                text("select id from profile_privacy where user_id = :uid"), {"uid": user_id}
            )).fetchone()
            if not privacy_exists:
                db.add(ProfilePrivacy(user_id=user_id))

            balance_exists = (await db.execute(
                text("select id from user_balances where user_id = :uid"), {"uid": uid} if False else {"uid": user_id}
            )).fetchone()
            if not balance_exists:
                await db.execute(text("insert into user_balances (user_id, balance) values (:uid, 0)"), {"uid": user_id})

            await db.commit()

            # 3. Add XP transactions
            # Check if user already has transactions today to avoid infinite growth on re-runs
            xp_exists = (await db.execute(
                text("select id from xp_transactions where user_id = :uid"), {"uid": user_id}
            )).fetchone()
            
            if not xp_exists:
                total_xp = random.randint(30, 1800)
                # Split total_xp into multiple chunks representing lessons, cards, and stories
                reasons = ['review_passed', 'word_learned', 'story_written', 'social', 'login']
                reasons_weights = [10, 5, 50, 2, 15]
                
                accumulated = 0
                while accumulated < total_xp:
                    # Choose a random reason
                    reason = random.choice(reasons)
                    amount = reasons_weights[reasons.index(reason)]
                    if accumulated + amount > total_xp:
                        amount = total_xp - accumulated
                    
                    db.add(XpTransactions(user_id=user_id, amount=amount, reason=reason))
                    accumulated += amount

                await db.commit()

                # Add to weekly leaderboard (random fraction of total XP)
                weekly_xp = int(total_xp * random.uniform(0.1, 1.0))
                await redis_client.zadd(ratings.weekly_leaderboard_key(), {str(user_id): weekly_xp})
                print(f"Added {total_xp} global XP and {weekly_xp} weekly XP for {username}.")

        # Rebuild global leaderboard
        await ratings.rebuild_from_db(db)
        print("Global leaderboard rebuilt successfully!")

if __name__ == '__main__':
    asyncio.run(seed())
