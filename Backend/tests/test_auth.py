from sqlalchemy import text

from tests.conftest import make_token


async def test_me_requires_no_token_returns_401(client):
    response = await client.get('/profile/me')

    assert response.status_code == 401


async def test_me_with_garbage_token_returns_401(client):
    response = await client.get('/profile/me', headers={'Authorization': 'Bearer not-a-real-token'})

    assert response.status_code == 401


async def test_me_with_valid_token_returns_own_profile(client, user, token):
    response = await client.get('/profile/me', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 200
    assert response.json()['user_id'] == user.id


async def test_me_with_deactivated_user_token_returns_401(client, db, user):
    deactivated_token = make_token(user.id)
    await db.execute(text('update users set is_active = false where id = :id'), {'id': user.id})
    await db.commit()

    response = await client.get('/profile/me', headers={'Authorization': f'Bearer {deactivated_token}'})

    assert response.status_code == 401
