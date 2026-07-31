from tests.conftest import make_token


async def _create_card(client, token, word='hello'):
    response = await client.post(
        '/deck/',
        json={'word': word, 'translation': 'привет', 'example': 'Hello there'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 200
    return response.json()


async def test_cannot_read_another_users_card(client, user, token, other_user):
    card = await _create_card(client, token)
    other_token = make_token(other_user.id)

    response = await client.get(f"/deck/{card['id']}", headers={'Authorization': f'Bearer {other_token}'})

    assert response.status_code == 404


async def test_cannot_change_another_users_card_status(client, user, token, other_user):
    card = await _create_card(client, token)
    other_token = make_token(other_user.id)

    response = await client.patch(
        f"/deck/{card['id']}/status",
        json={'status': 'learned'},
        headers={'Authorization': f'Bearer {other_token}'},
    )

    assert response.status_code == 404

    own_view = await client.get(f"/deck/{card['id']}", headers={'Authorization': f'Bearer {token}'})
    assert own_view.json()['status'] != 'learned'


async def test_cannot_delete_another_users_card(client, user, token, other_user):
    card = await _create_card(client, token)
    other_token = make_token(other_user.id)

    response = await client.delete(f"/deck/{card['id']}", headers={'Authorization': f'Bearer {other_token}'})

    assert response.status_code == 404

    own_view = await client.get(f"/deck/{card['id']}", headers={'Authorization': f'Bearer {token}'})
    assert own_view.status_code == 200


async def test_cannot_submit_review_for_another_users_card(client, user, token, other_user):
    card = await _create_card(client, token)
    other_token = make_token(other_user.id)

    response = await client.post(
        f"/reviews/{card['id']}",
        json={'quality': 5},
        headers={'Authorization': f'Bearer {other_token}'},
    )

    assert response.status_code == 404
