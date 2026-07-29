from app.celery_app import celery_app


@celery_app.task(name='app.tasks.analytics.process_event')
def process_analytics_event(**kwargs):
    return kwargs


@celery_app.task(name='app.tasks.analytics.rebuild_leaderboards')
def rebuild_leaderboards_task():
    return 'rebuilt'


@celery_app.task(name='app.tasks.analytics.nightly_achievements_check')
def nightly_achievements_check_task():
    return 'checked'


@celery_app.task(name='app.tasks.analytics.reset_weekly_leaderboard')
def reset_weekly_leaderboard_task():
    return 'reset'


@celery_app.task(name='app.tasks.analytics.recompute_daily_metrics')
def recompute_daily_metrics_task():
    return 'recomputed'
