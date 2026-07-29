from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_payment import Purchases
from app.models.model_user_story import (
    StoryExerciseAttempts,
    StoryExercises,
    StoryPurchases,
    StoryReviews,
    UserStories,
)
from app.schemas.schema_user_story import ExerciseCreate, ReviewCreate, UserStoryCreate, UserStoryUpdate
from app.services import crud_subscription, purchase_service, ratings

SELLER_SHARE = Decimal('0.7')


async def create_user_story(data: UserStoryCreate, author_id: int, db: AsyncSession):
    if data.price is not None and not data.description:
        raise AppError(
            code='PAID_STORY_NEEDS_DESCRIPTION',
            message='Paid stories must have a description',
            status_code=400,
        )

    story = UserStories(
        author_id=author_id,
        title=data.title,
        body=data.body,
        description=data.description,
        cefr_level=data.cefr_level,
        genre=data.genre,
        price=data.price,
        image_url=data.image_url,
    )

    db.add(story)
    await db.commit()
    await db.refresh(story)
    return story


async def get_user_story(story_id: int, db: AsyncSession):
    result = await db.execute(select(UserStories).where(UserStories.id == story_id))
    return result.scalar_one_or_none()


async def update_user_story(story_id: int, author_id: int, data: UserStoryUpdate, db: AsyncSession):
    story = await get_user_story(story_id, db)

    if story is None or story.author_id != author_id:
        return None

    story.title = data.title or story.title
    story.body = data.body or story.body
    story.description = data.description or story.description
    story.cefr_level = data.cefr_level or story.cefr_level
    story.genre = data.genre or story.genre
    story.image_url = data.image_url or story.image_url

    if data.price is not None:
        story.price = data.price

    if story.price is not None and not story.description:
        raise AppError(
            code='PAID_STORY_NEEDS_DESCRIPTION',
            message='Paid stories must have a description',
            status_code=400,
        )

    await db.commit()
    await db.refresh(story)
    return story


async def delete_user_story(story_id: int, author_id: int, db: AsyncSession):
    story = await get_user_story(story_id, db)

    if story is None or story.author_id != author_id:
        return None

    await db.delete(story)
    await db.commit()
    return story


async def publish_user_story(story_id: int, author_id: int, db: AsyncSession):
    story = await get_user_story(story_id, db)

    if story is None or story.author_id != author_id:
        return None

    if story.price is not None and not story.description:
        raise AppError(
            code='PAID_STORY_NEEDS_DESCRIPTION',
            message='Paid stories must have a description',
            status_code=400,
        )

    story.status = 'published'

    await db.commit()
    await db.refresh(story)
    return story


async def get_user_stories(
    db: AsyncSession, level=None, genre=None, is_free=None, author_id=None, limit=20, offset=0
):
    query = select(UserStories).where(UserStories.status == 'published')

    if level:
        query = query.where(UserStories.cefr_level == level)
    if genre:
        query = query.where(UserStories.genre == genre)
    if is_free is not None:
        query = query.where(UserStories.price.is_(None) if is_free else UserStories.price.isnot(None))
    if author_id:
        query = query.where(UserStories.author_id == author_id)

    query = query.order_by(UserStories.id.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    stories = result.scalars().all()

    return [
        {**user_story_to_response(story), 'average_rating': await get_average_rating(story.id, db)}
        for story in stories
    ]


async def get_average_rating(story_id: int, db: AsyncSession):
    result = await db.execute(select(func.avg(StoryReviews.rating)).where(StoryReviews.story_id == story_id))
    average = result.scalar_one_or_none()
    return round(float(average), 2) if average is not None else None


async def has_story_access(story: UserStories, user_id: int, db: AsyncSession):
    if story.price is None or story.author_id == user_id:
        return True

    result = await db.execute(
        select(StoryPurchases).where(StoryPurchases.story_id == story.id, StoryPurchases.buyer_id == user_id)
    )
    return result.scalar_one_or_none() is not None


def user_story_to_response(story: UserStories):
    return {
        'id': story.id,
        'author_id': story.author_id,
        'title': story.title,
        'description': story.description,
        'cefr_level': story.cefr_level,
        'genre': story.genre,
        'price': story.price,
        'image_url': story.image_url,
        'status': story.status,
        'views_count': story.views_count,
        'created_at': story.created_at,
    }


async def get_user_story_detail(story_id: int, user_id: int, db: AsyncSession):
    story = await get_user_story(story_id, db)

    if story is None:
        return None

    story.views_count += 1
    await db.commit()
    await db.refresh(story)

    response = user_story_to_response(story)

    if await has_story_access(story, user_id, db):
        response['body'] = story.body

    return response


async def buy_story(story_id: int, buyer_id: int, db: AsyncSession):
    story = await get_user_story(story_id, db)

    if story is None or story.price is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    if story.author_id == buyer_id:
        raise AppError(code='CANNOT_BUY_OWN_STORY', message='You cannot buy your own story', status_code=400)

    if await has_story_access(story, buyer_id, db):
        raise AppError(code='ALREADY_PURCHASED', message='You already own this story', status_code=400)

    subscription = await crud_subscription.get_active_subscription(buyer_id, db)

    if not subscription['plan'].can_buy_stories:
        raise AppError(
            code='CANNOT_BUY_STORIES', message='Your plan does not allow buying stories', status_code=403
        )

    async def create_entity(db: AsyncSession):
        db.add(StoryPurchases(story_id=story.id, buyer_id=buyer_id))

    return await purchase_service.purchase(
        buyer_id,
        story.price,
        'user_story',
        db,
        item_id=story.id,
        seller_id=story.author_id,
        seller_share=SELLER_SHARE,
        create_entity=create_entity,
    )


async def create_story_exercise(story_id: int, author_id: int, data: ExerciseCreate, db: AsyncSession):
    story = await get_user_story(story_id, db)

    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    if story.author_id != author_id:
        raise AppError(
            code='NOT_STORY_AUTHOR', message='Only the author can add exercises', status_code=403
        )

    exercise = StoryExercises(
        story_id=story_id,
        type=data.type,
        question=data.question,
        options=data.options,
        answer=data.answer,
        explanation=data.explanation,
    )

    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise


async def get_story_exercises(story_id: int, db: AsyncSession):
    result = await db.execute(select(StoryExercises).where(StoryExercises.story_id == story_id))
    return result.scalars().all()


async def submit_story_exercises(story_id: int, user_id: int, answers, db: AsyncSession):
    story = await get_user_story(story_id, db)

    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    if not await has_story_access(story, user_id, db):
        raise AppError(code='ACCESS_DENIED', message='You do not have access to this story', status_code=403)

    exercises = await get_story_exercises(story_id, db)
    exercises_by_id = {exercise.id: exercise for exercise in exercises}

    correct = 0

    for answer in answers:
        exercise = exercises_by_id.get(answer.exercise_id)

        if exercise is None:
            continue

        is_correct = answer.answer.strip().lower() == exercise.answer.strip().lower()

        if is_correct:
            correct += 1

        db.add(StoryExerciseAttempts(user_id=user_id, exercise_id=exercise.id, is_correct=is_correct))

    await db.commit()

    for _ in range(correct):
        await ratings.award_xp(user_id, 'review_passed', db)

    return {
        'total': len(answers),
        'correct': correct,
    }


async def create_story_review(story_id: int, user_id: int, data: ReviewCreate, db: AsyncSession):
    story = await get_user_story(story_id, db)

    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    if not await has_story_access(story, user_id, db):
        raise AppError(code='ACCESS_DENIED', message='You do not have access to this story', status_code=403)

    existing = await db.execute(
        select(StoryReviews).where(StoryReviews.story_id == story_id, StoryReviews.user_id == user_id)
    )

    if existing.scalar_one_or_none() is not None:
        raise AppError(code='ALREADY_REVIEWED', message='You already reviewed this story', status_code=400)

    review = StoryReviews(story_id=story_id, user_id=user_id, rating=data.rating, text=data.text)
    db.add(review)
    await db.commit()
    await db.refresh(review)

    await ratings.award_xp(story.author_id, 'review_received', db)

    return review


async def get_story_reviews(story_id: int, db: AsyncSession):
    result = await db.execute(select(StoryReviews).where(StoryReviews.story_id == story_id))
    return result.scalars().all()


async def get_author_stats(author_id: int, db: AsyncSession):
    stories = (
        await db.execute(select(UserStories).where(UserStories.author_id == author_id))
    ).scalars().all()

    per_story = []
    total_views = 0
    total_purchases = 0
    total_income = Decimal('0')

    for story in stories:
        purchases_count = await db.scalar(
            select(func.count()).select_from(StoryPurchases).where(StoryPurchases.story_id == story.id)
        )
        income = await db.scalar(
            select(func.coalesce(func.sum(Purchases.seller_income), 0)).where(
                Purchases.item_type == 'user_story',
                Purchases.item_id == story.id,
                Purchases.seller_id == author_id,
            )
        )
        average_rating = await get_average_rating(story.id, db)

        per_story.append({
            'story_id': story.id,
            'title': story.title,
            'views_count': story.views_count,
            'purchases_count': purchases_count or 0,
            'income': income or Decimal('0'),
            'average_rating': average_rating,
        })

        total_views += story.views_count
        total_purchases += purchases_count or 0
        total_income += income or Decimal('0')

    return {
        'stories': per_story,
        'total_views': total_views,
        'total_purchases': total_purchases,
        'total_income': total_income,
    }
