from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_user_story import UserStories
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
