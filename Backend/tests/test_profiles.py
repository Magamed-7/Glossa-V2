from tests.conftest import make_token


async def test_public_profile_shows_followers_count_by_default(client, user, other_user, token):
    response = await client.get(f'/profile/{other_user.id}', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 200
    assert 'followers_count' in response.json()


async def test_public_profile_hides_followers_count_when_privacy_disabled(client, user, other_user, token):
    other_token = make_token(other_user.id)

    patch_response = await client.patch(
        '/profile/me/privacy',
        json={'show_followers': False},
        headers={'Authorization': f'Bearer {other_token}'},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()['show_followers'] is False

    response = await client.get(f'/profile/{other_user.id}', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 200
    assert 'followers_count' not in response.json()
    assert 'following_count' not in response.json()
