from app.core.limits import add_ai_seconds
from app.models.model_profile import UserLanguages


async def _set_target_language_level(db, user_id, level):
    db.add(UserLanguages(user_id=user_id, language='en', level=level, is_target=True))
    await db.commit()


async def test_writer_level_gate_blocks_below_b2(client, user, token):
    response = await client.post(
        '/user-stories',
        json={'title': 'My story', 'body': 'Once upon a time', 'cefr_level': 'A1'},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 403
    assert response.json()['error']['code'] == 'WRITER_LEVEL_REQUIRED'


async def test_writer_level_gate_allows_b2_and_above(client, db, user, token):
    await _set_target_language_level(db, user.id, 'B2')

    response = await client.post(
        '/user-stories',
        json={'title': 'My story', 'body': 'Once upon a time', 'cefr_level': 'B2'},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200


async def test_own_story_weekly_limit_free_plan_caps_at_three(client, db, user, token):
    await _set_target_language_level(db, user.id, 'B2')

    for i in range(3):
        response = await client.post(
            '/user-stories',
            json={'title': f'Story {i}', 'body': 'Once upon a time', 'cefr_level': 'B2'},
            headers={'Authorization': f'Bearer {token}'},
        )
        assert response.status_code == 200

    fourth = await client.post(
        '/user-stories',
        json={'title': 'Story 4', 'body': 'Once upon a time', 'cefr_level': 'B2'},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert fourth.status_code == 403
    assert fourth.json()['error']['code'] == 'LIMIT_REACHED'


async def test_deck_word_daily_limit_free_plan_caps_at_thirty_five(client, user, token):
    for i in range(35):
        response = await client.post(
            '/deck/',
            json={'word': f'word_{i}', 'translation': f'слово_{i}'},
            headers={'Authorization': f'Bearer {token}'},
        )
        assert response.status_code == 200

    thirty_sixth = await client.post(
        '/deck/',
        json={'word': 'word_35', 'translation': 'слово_35'},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert thirty_sixth.status_code == 403
    assert thirty_sixth.json()['error']['code'] == 'LIMIT_REACHED'


async def test_story_reading_daily_limit_free_plan_caps_at_five(client, user, token):
    for _ in range(5):
        response = await client.get(
            '/stories/999999999', headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code == 404

    sixth = await client.get('/stories/999999999', headers={'Authorization': f'Bearer {token}'})

    assert sixth.status_code == 403
    assert sixth.json()['error']['code'] == 'LIMIT_REACHED'


async def test_ai_access_denied_for_free_plan(client, user, token):
    response = await client.get('/ai/errors/my', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 403
    assert response.json()['error']['code'] == 'AI_ACCESS_DENIED'


async def test_ai_access_allowed_for_premium_until_time_limit_reached(client, premium_user, premium_token):
    response = await client.get('/ai/errors/my', headers={'Authorization': f'Bearer {premium_token}'})
    assert response.status_code == 200

    await add_ai_seconds(premium_user.id, 9000)

    after_limit = await client.get('/ai/errors/my', headers={'Authorization': f'Bearer {premium_token}'})

    assert after_limit.status_code == 403
    assert after_limit.json()['error']['code'] == 'AI_LIMIT_REACHED'
