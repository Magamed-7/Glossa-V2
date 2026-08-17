import uuid
from datetime import datetime, timedelta, timezone

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.db.database import engine, get_db
from app.main import app
from app.models.model_subscription import Plans, UserSubscriptions


@pytest_asyncio.fixture
async def session_factory():
    async with engine.connect() as conn:
        await conn.begin()
        yield async_sessionmaker(bind=conn, expire_on_commit=False, join_transaction_mode='create_savepoint')
        await conn.rollback()


@pytest_asyncio.fixture
async def db(session_factory):
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(session_factory):
    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url='http://test') as ac:
        yield ac

    app.dependency_overrides.clear()


async def _create_user(db, role='student'):
    unique = uuid.uuid4().hex[:10]
    now = datetime.now(timezone.utc)

    result = await db.execute(
        text('''
            insert into users (
                username, email, password, role, is_verified, is_active,
                is_staff, is_superuser, is_2fa_enabled, date_joined, created_at,
                first_name, last_name
            ) values (
                :username, :email, :password, :role, true, true,
                false, false, false, :now, :now,
                '', ''
            ) returning id, username, email
        '''),
        {
            'username': f'test_{unique}',
            'email': f'test_{unique}@example.com',
            'password': '!unusable',
            'role': role,
            'now': now,
        },
    )
    row = result.fetchone()
    await db.commit()
    return row


@pytest_asyncio.fixture
async def user(db):
    return await _create_user(db)


@pytest_asyncio.fixture
async def other_user(db):
    return await _create_user(db)


@pytest_asyncio.fixture
async def premium_user(db):
    row = await _create_user(db)

    plan_result = await db.execute(text("select id from plans where code = 'premium'"))
    plan_id = plan_result.scalar_one_or_none()

    if plan_id is None:
        plan = Plans(
            code='premium',
            price_monthly=250,
            price_half_yearly=1440,
            price_yearly=2760,
            stories_per_day=None,
            deck_words_per_day=None,
            own_stories_per_week=12,
            ai_seconds_per_day=9000,
            can_buy_stories=True,
            telegram_access=True,
        )
        db.add(plan)
        await db.flush()
        plan_id = plan.id

    db.add(
        UserSubscriptions(
            user_id=row.id,
            plan_id=plan_id,
            period='monthly',
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            is_active=True,
        )
    )
    await db.commit()
    return row


def make_token(user_id):
    payload = {
        'user_id': user_id,
        'token_type': 'access',
        'exp': datetime.now(timezone.utc) + timedelta(minutes=30),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@pytest_asyncio.fixture
async def token(user):
    return make_token(user.id)


@pytest_asyncio.fixture
async def premium_token(premium_user):
    return make_token(premium_user.id)
