from app.services import crud_story
from mcp_server.db import AsyncSessionLocal
from mcp_server.instance import mcp


@mcp.tool()
async def search_stories(level: str | None = None, topic: str | None = None) -> list[dict]:
    """Search system stories by CEFR level and/or grammar topic."""
    async with AsyncSessionLocal() as db:
        stories = await crud_story.get_stories(db, level=level, topic=topic)
        return [crud_story.story_to_response(story) for story in stories]


@mcp.tool()
async def get_story(story_id: int) -> dict:
    """Return a system story's full details including body text."""
    async with AsyncSessionLocal() as db:
        story = await crud_story.get_story(story_id, db)

        if story is None:
            return {'error': 'STORY_NOT_FOUND', 'message': 'Story not found'}

        return {**crud_story.story_to_response(story), 'body': story.body_en}
