import logging
from datetime import date, datetime, timedelta
from sqlalchemy import func, select, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_card import Cards, ReviewLogs
from app.models.model_rating import XpTransactions
from app.services import crud_settings, streaks, crud_subscription

logger = logging.getLogger(__name__)


async def get_daily_missions(user_id: int, db: AsyncSession):
    # 1. Fetch settings, streaks and subscriptions
    settings = await crud_settings.get_settings(user_id, db)
    daily_goal = settings.daily_goal

    streak_obj = await streaks.touch_streak(user_id, db)
    
    # Check if month has changed to reset monthly restore counter
    current_month_str = date.today().strftime("%Y-%m")
    if streak_obj.last_restore_month != current_month_str:
        streak_obj.restores_used_this_month = 0
        streak_obj.last_restore_month = current_month_str
        await db.commit()

    streak_count = streak_obj.current_streak
    restores_used = streak_obj.restores_used_this_month

    sub = await crud_subscription.get_active_subscription(user_id, db)
    plan_code = sub["plan"].code if sub and "plan" in sub else "free"
    
    max_restores = 1
    if plan_code == "premium":
        max_restores = 5
    elif plan_code == "pro":
        max_restores = 10

    today = date.today()
    streak_maintained = False
    if streak_obj.last_activity_date:
        if streak_obj.last_activity_date == today or streak_obj.last_activity_date == today - timedelta(days=1):
            streak_maintained = True

    # If the user has a saved prev_streak_before_reset that was reset, they are in a broken (restorable) state
    if streak_obj.prev_streak_before_reset > streak_obj.current_streak:
        streak_maintained = False


    # 2. Get start of today (min time)
    # Get timezone-aware start of today based on local timezone
    local_tz = datetime.now().astimezone().tzinfo
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=local_tz)

    # 3. Fetch reviews count today
    review_count_query = select(func.count(ReviewLogs.id)).join(
        Cards, Cards.id == ReviewLogs.card_id
    ).where(
        Cards.user_id == user_id,
        ReviewLogs.reviewed_at >= today_start
    )
    review_count = (await db.execute(review_count_query)).scalar() or 0

    # 4. Fetch new words count today
    new_words_query = select(func.count(Cards.id)).where(
        Cards.user_id == user_id,
        Cards.created_at >= today_start
    )
    new_words_count = (await db.execute(new_words_query)).scalar() or 0

    # 5. Fetch XP gained today
    xp_today_query = select(func.sum(XpTransactions.amount)).where(
        XpTransactions.user_id == user_id,
        XpTransactions.created_at >= today_start
    )
    xp_today = (await db.execute(xp_today_query)).scalar() or 0

    # 6. Fetch total XP
    xp_total_query = select(func.sum(XpTransactions.amount)).where(
        XpTransactions.user_id == user_id
    )
    xp_total = (await db.execute(xp_total_query)).scalar() or 0

    # 7. Calculate Rank and level boundaries
    if xp_total < 500:
        rank = "Lexicon Recruit"
        xp_level_min = 0
        xp_level_max = 500
    elif xp_total < 1000:
        rank = "Archive Analyst"
        xp_level_min = 500
        xp_level_max = 1000
    elif xp_total < 2000:
        rank = "Senior Cryptographer"
        xp_level_min = 1000
        xp_level_max = 2000
    elif xp_total < 5000:
        rank = "Master Decipherer"
        xp_level_min = 2000
        xp_level_max = 5000
    else:
        rank = "Director of Lexicography"
        xp_level_min = 5000
        xp_level_max = 10000

    # 8. Weekly Operations Log (Monday to Sunday of the current week)
    # weekday() returns 0 for Mon, 6 for Sun.
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week_dt = datetime.combine(start_of_week, datetime.min.time(), tzinfo=local_tz)

    date_field = func.cast(ReviewLogs.reviewed_at, Date)
    weekly_reviews_query = (
        select(date_field, func.count(ReviewLogs.id))
        .join(Cards, Cards.id == ReviewLogs.card_id)
        .where(
            Cards.user_id == user_id,
            ReviewLogs.reviewed_at >= start_of_week_dt
        )
        .group_by(date_field)
    )
    weekly_reviews = (await db.execute(weekly_reviews_query)).all()
    reviews_by_date = {r[0]: r[1] for r in weekly_reviews}

    # Calculate start of current streak
    start_of_streak = None
    if streak_obj.last_activity_date and streak_obj.current_streak > 0:
        start_of_streak = streak_obj.last_activity_date - timedelta(days=streak_obj.current_streak - 1)

    operations_log = []
    day_names = ["M", "T", "W", "T", "F", "S", "S"]
    for i in range(7):
        day_date = start_of_week + timedelta(days=i)
        day_review_count = reviews_by_date.get(day_date, 0)
        is_completed = day_review_count >= daily_goal
        
        if not is_completed and start_of_streak:
            if start_of_streak <= day_date <= streak_obj.last_activity_date:
                is_completed = True

        operations_log.append({
            "day": day_names[i],
            "date": day_date,
            "completed": is_completed
        })

    # 9. Build Daily Missions list
    daily_missions = [
        {
            "id": "cleanup",
            "title": "Operational Clean-up",
            "description": f"Review at least {daily_goal} words today",
            "progress": review_count,
            "target": daily_goal,
            "completed": review_count >= daily_goal
        },
        {
            "id": "new_cipher",
            "title": "New Cipher",
            "description": "Add 5 new words to the deck today",
            "progress": new_words_count,
            "target": 5,
            "completed": new_words_count >= 5
        },
        {
            "id": "speed_march",
            "title": "Speed March",
            "description": "Earn 100 XP in reviews/learning today",
            "progress": xp_today,
            "target": 100,
            "completed": xp_today >= 100
        }
    ]

    return {
        "streak": streak_count,
        "streak_maintained": streak_maintained,
        "xp_today": xp_today,
        "xp_total": xp_total,
        "xp_level_min": xp_level_min,
        "xp_level_max": xp_level_max,
        "rank": rank,
        "operations_log": operations_log,
        "daily_missions": daily_missions,
        "restores_used_this_month": restores_used,
        "max_restores": max_restores,
        "prev_streak_before_reset": streak_obj.prev_streak_before_reset
    }
