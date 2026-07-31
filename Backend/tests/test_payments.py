from decimal import Decimal

import pytest
from sqlalchemy import select

from app.models.model_subscription import UserSubscriptions
from app.models.model_user_story import UserStories
from app.services import crud_payment, purchase_service


async def test_new_user_balance_is_zero(client, user, token):
    response = await client.get('/balance', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 200
    assert response.json()['balance'] == '0.00'


async def test_topup_increases_balance(client, user, token):
    response = await client.post(
        '/balance/topup', json={'amount': '100.00'}, headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    assert response.json()['balance'] == '100.00'

    second = await client.post(
        '/balance/topup', json={'amount': '50.00'}, headers={'Authorization': f'Bearer {token}'}
    )
    assert second.json()['balance'] == '150.00'


async def test_topup_non_positive_amount_rejected(client, user, token):
    response = await client.post(
        '/balance/topup', json={'amount': '0'}, headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 400
    assert response.json()['error']['code'] == 'INVALID_AMOUNT'


async def test_topup_appears_in_payment_history(client, user, token):
    await client.post('/balance/topup', json={'amount': '30.00'}, headers={'Authorization': f'Bearer {token}'})

    response = await client.get('/payments/history', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 200
    entries = response.json()
    assert len(entries) == 1
    assert entries[0]['item_type'] == 'topup'
    assert entries[0]['amount'] == '30.00'


async def test_get_plans_includes_seeded_free_plan(client, user, token):
    response = await client.get('/subscriptions/plans')

    assert response.status_code == 200
    codes = [plan['code'] for plan in response.json()]
    assert 'free' in codes
    assert 'premium' in codes


async def test_my_subscription_defaults_to_free_plan(client, user, token):
    response = await client.get('/subscriptions/my', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 200
    body = response.json()
    assert body['plan']['code'] == 'free'
    assert body['is_active'] is True
    assert body['expires_at'] is None


async def test_subscribe_without_enough_balance_fails(client, user, token):
    response = await client.post(
        '/subscriptions/subscribe',
        json={'plan_code': 'premium', 'period': 'monthly'},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 400
    assert response.json()['error']['code'] == 'INSUFFICIENT_FUNDS'


async def test_subscribe_with_sufficient_balance_activates_plan_and_deducts_balance(client, user, token):
    await client.post('/balance/topup', json={'amount': '250.00'}, headers={'Authorization': f'Bearer {token}'})

    response = await client.post(
        '/subscriptions/subscribe',
        json={'plan_code': 'premium', 'period': 'monthly'},
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    body = response.json()
    assert body['plan']['code'] == 'premium'
    assert body['period'] == 'monthly'
    assert body['is_active'] is True
    assert body['expires_at'] is not None

    balance_response = await client.get('/balance', headers={'Authorization': f'Bearer {token}'})
    assert balance_response.json()['balance'] == '0.00'

    my_subscription = await client.get('/subscriptions/my', headers={'Authorization': f'Bearer {token}'})
    assert my_subscription.json()['plan']['code'] == 'premium'


async def test_resubscribing_deactivates_previous_subscription(client, db, user, token):
    await client.post('/balance/topup', json={'amount': '750.00'}, headers={'Authorization': f'Bearer {token}'})

    await client.post(
        '/subscriptions/subscribe',
        json={'plan_code': 'premium', 'period': 'monthly'},
        headers={'Authorization': f'Bearer {token}'},
    )
    await client.post(
        '/subscriptions/subscribe',
        json={'plan_code': 'pro', 'period': 'monthly'},
        headers={'Authorization': f'Bearer {token}'},
    )

    result = await db.execute(select(UserSubscriptions).where(UserSubscriptions.user_id == user.id))
    subscriptions = result.scalars().all()

    assert len(subscriptions) == 2
    active = [s for s in subscriptions if s.is_active]
    assert len(active) == 1

    my_subscription = await client.get('/subscriptions/my', headers={'Authorization': f'Bearer {token}'})
    assert my_subscription.json()['plan']['code'] == 'pro'


async def test_purchase_atomicity_rolls_back_balance_on_create_entity_failure(client, db, user, token):
    await client.post('/balance/topup', json={'amount': '100.00'}, headers={'Authorization': f'Bearer {token}'})

    async def failing_create_entity(db):
        raise RuntimeError('boom')

    with pytest.raises(RuntimeError):
        await purchase_service.purchase(
            user.id, Decimal('40.00'), 'test_item', db, create_entity=failing_create_entity
        )

    balance = await crud_payment.get_or_create_balance(user.id, db)
    assert balance.balance == Decimal('100.00')

    history = await crud_payment.get_payment_history(user.id, db)
    assert len(history) == 1
    assert history[0].item_type == 'topup'


async def test_buying_story_splits_income_seventy_thirty_with_author(
    client, db, other_user, premium_user, premium_token
):
    story = UserStories(
        author_id=other_user.id,
        title='Test story',
        body='Once upon a time',
        cefr_level='A1',
        price=Decimal('100.00'),
        status='published',
    )
    db.add(story)
    await db.commit()
    await db.refresh(story)

    await client.post(
        '/balance/topup', json={'amount': '100.00'}, headers={'Authorization': f'Bearer {premium_token}'}
    )

    response = await client.post(
        f'/user-stories/{story.id}/buy', headers={'Authorization': f'Bearer {premium_token}'}
    )

    assert response.status_code == 200

    buyer_balance = await crud_payment.get_or_create_balance(premium_user.id, db)
    assert buyer_balance.balance == Decimal('0.00')

    author_balance = await crud_payment.get_or_create_balance(other_user.id, db)
    assert author_balance.balance == Decimal('70.00')

    history = await crud_payment.get_payment_history(premium_user.id, db)
    purchase_entry = next(entry for entry in history if entry.item_type == 'user_story')
    assert purchase_entry.amount == Decimal('100.00')
    assert purchase_entry.seller_income == Decimal('70.00')


async def test_stripe_webhook_replay_does_not_double_credit(client, db, user, token):
    await crud_payment.topup_balance(user.id, Decimal('50.00'), db, stripe_event_id='evt_test_123')

    already_processed = await crud_payment.stripe_event_already_processed('evt_test_123', db)
    assert already_processed is True

    balance = await crud_payment.get_or_create_balance(user.id, db)
    assert balance.balance == Decimal('50.00')

    from sqlalchemy.exc import IntegrityError

    with pytest.raises(IntegrityError):
        await crud_payment.topup_balance(user.id, Decimal('50.00'), db, stripe_event_id='evt_test_123')
