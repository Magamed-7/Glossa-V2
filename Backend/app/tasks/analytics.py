from app.celery_app import celery_app
from app.core.redis_client import redis_client
from app.core.task_loop import run_async
from app.db.database import AsyncSessionLocal


@celery_app.task(name='app.tasks.analytics.process_event')
def process_analytics_event(action=None, **kwargs):
    if action == 'check_achievements':
        return check_achievements_task(kwargs['user_id'])

    return kwargs


@celery_app.task(name='app.tasks.analytics.check_achievements')
def check_achievements_task(user_id: int):
    from app.services import achievements

    async def run():
        async with AsyncSessionLocal() as db:
            awarded = await achievements.check_achievements(user_id, db)
            return [a.code for a in awarded]

    return run_async(run())


@celery_app.task(name='app.tasks.analytics.rebuild_leaderboards')
def rebuild_leaderboards_task():
    from app.services import ratings

    async def run():
        async with AsyncSessionLocal() as db:
            await ratings.rebuild_from_db(db)
            return 'rebuilt'

    return run_async(run())


@celery_app.task(name='app.tasks.analytics.nightly_achievements_check')
def nightly_achievements_check_task():
    return 'checked'


@celery_app.task(name='app.tasks.analytics.reset_weekly_leaderboard')
def reset_weekly_leaderboard_task():
    from app.services import ratings
    from app.services.notify_service import notify_all_users_leaderboard_reset

    async def run():
        await redis_client.delete(ratings.weekly_leaderboard_key())
        async with AsyncSessionLocal() as db:
            await notify_all_users_leaderboard_reset('weekly', db)
        return 'reset'

    return run_async(run())


@celery_app.task(name='app.tasks.analytics.recompute_daily_metrics')
def recompute_daily_metrics_task():
    return 'recomputed'
