import pytest
from datetime import datetime, timezone, date, timedelta
from sqlalchemy import text
from app.services import ratings, streaks

@pytest.mark.asyncio
async def test_get_daily_missions_empty(client, token):
    # 1. Fetch daily missions on clean user
    response = await client.get(
        '/learning/daily-missions',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'streak' in data
    assert 'streak_maintained' in data
    assert data['xp_today'] == 0
    assert data['xp_total'] == 0
    assert data['rank'] == "Lexicon Recruit"
    assert len(data['operations_log']) == 7
    assert len(data['daily_missions']) == 3

    # Check daily missions default values
    missions = {m['id']: m for m in data['daily_missions']}
    assert 'cleanup' in missions
    assert missions['cleanup']['progress'] == 0
    assert missions['cleanup']['target'] == 10
    assert missions['cleanup']['completed'] is False

    assert 'new_cipher' in missions
    assert missions['new_cipher']['progress'] == 0
    assert missions['new_cipher']['target'] == 5
    assert missions['new_cipher']['completed'] is False

    assert 'speed_march' in missions
    assert missions['speed_march']['progress'] == 0
    assert missions['speed_march']['target'] == 100
    assert missions['speed_march']['completed'] is False


@pytest.mark.asyncio
async def test_daily_missions_with_progress(client, token, db, user):
    user_id = user.id
    assert user_id is not None

    # Enable ratings in settings
    await db.execute(text(
        "update user_settings set ratings_enabled = true where user_id = :uid"
    ), {"uid": user_id})
    await db.commit()

    # 1. Create a card today
    card_res = await client.post(
        '/deck/',
        json={'word': 'testword', 'translation': 'тест', 'example': 'This is a test'},
        headers={'Authorization': f'Bearer {token}'}
    )
    assert card_res.status_code == 200
    card_id = card_res.json()['id']

    # 2. Submit a review today
    # Awarding XP for review_passed
    await ratings.award_xp(user_id, 'review_passed', db)

    # Insert a review log manually for today
    await db.execute(text(
        "insert into review_logs (card_id, quality, reviewed_at) values (:cid, 5, now())"
    ), {"cid": card_id})
    await db.commit()

    # Get daily missions again
    response = await client.get(
        '/learning/daily-missions',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    data = response.json()

    missions = {m['id']: m for m in data['daily_missions']}
    # Word added today: new_cipher progress should be 1
    assert missions['new_cipher']['progress'] == 1
    
    # Review logged today: cleanup progress should be 1
    assert missions['cleanup']['progress'] == 1

    # XP awarded (review_passed = 10 XP + card creation = 2 XP): speed_march progress should be 12
    assert missions['speed_march']['progress'] == 12
    assert data['xp_today'] == 12
    assert data['xp_total'] == 12


@pytest.mark.asyncio
async def test_restore_streak(client, token, db, user):
    user_id = user.id
    assert user_id is not None

    # Ensure streak row exists first
    await streaks.get_streak(user_id, db)
    await db.commit()

    # 1. Update user streak to be broken (last activity 3 days ago)
    await db.execute(text(
        "update user_streaks set current_streak = 5, best_streak = 5, last_activity_date = :ld where user_id = :uid"
    ), {"ld": date.today() - timedelta(days=3), "uid": user_id})
    await db.commit()

    # Get daily missions to verify it is broken
    response = await client.get(
        '/learning/daily-missions',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert data['streak_maintained'] is False
    assert data['restores_used_this_month'] == 0
    assert data['max_restores'] == 1

    # 2. Call restore endpoint
    res_restore = await client.post(
        '/learning/streak/restore',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert res_restore.status_code == 200
    r_data = res_restore.json()
    assert r_data['streak_maintained'] is True
    assert r_data['restores_used_this_month'] == 1

    # 3. Call restore again (should fail with 400 because it's already active)
    res_restore_again = await client.post(
        '/learning/streak/restore',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert res_restore_again.status_code == 400
    assert res_restore_again.json()['error']['message'] == 'Streak is already active and does not need restoration'



