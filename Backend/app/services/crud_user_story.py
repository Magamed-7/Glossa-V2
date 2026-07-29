from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_user_story import StoryPurchases, UserStories
from app.schemas.schema_user_story import UserStoryCreate, UserStoryUpdate


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
    return result.scalars().all()


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
