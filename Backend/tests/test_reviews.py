import pytest


async def _create_card(client, token, word='hello'):
    response = await client.post(
        '/deck/',
        json={'word': word, 'translation': 'привет', 'example': 'Hello there'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 200
    return response.json()


async def test_new_card_is_due_today(client, premium_user, premium_token):
    card = await _create_card(client, premium_token)

    response = await client.get('/reviews/today', headers={'Authorization': f'Bearer {premium_token}'})

    assert response.status_code == 200
    assert card['id'] in [c['id'] for c in response.json()]


async def test_submit_review_applies_sm2_and_removes_card_from_due_list(client, premium_user, premium_token):
    card = await _create_card(client, premium_token)

    response = await client.post(
        f"/reviews/{card['id']}",
        json={'quality': 5},
        headers={'Authorization': f'Bearer {premium_token}'},
    )

    assert response.status_code == 200
    body = response.json()
    assert body['interval'] == 1
    assert body['repetitions'] == 1
    assert body['ease_factor'] == pytest.approx(2.6)

    due_response = await client.get('/reviews/today', headers={'Authorization': f'Bearer {premium_token}'})
    assert card['id'] not in [c['id'] for c in due_response.json()]


async def test_submit_review_for_unknown_card_returns_404(client, premium_user, premium_token):
    response = await client.post(
        '/reviews/999999999',
        json={'quality': 5},
        headers={'Authorization': f'Bearer {premium_token}'},
    )

    assert response.status_code == 404


async def test_learning_stats_reflects_created_card(client, premium_user, premium_token):
    await _create_card(client, premium_token, word='goodbye')

    response = await client.get('/learning/stats', headers={'Authorization': f'Bearer {premium_token}'})

    assert response.status_code == 200
    assert response.json()['cards_total'] >= 1
