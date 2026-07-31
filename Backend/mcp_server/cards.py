from app.core.errors import AppError
from app.schemas.schema_learning import CardCreate
from app.services import crud_card
from app.services.review import get_due_cards as _get_due_cards
from mcp_server.db import AsyncSessionLocal
from mcp_server.instance import mcp


@mcp.tool()
async def get_due_cards(user_id: int) -> list[dict]:
    """Return the user's flashcards that are due for spaced-repetition review today."""
    async with AsyncSessionLocal() as db:
        cards = await _get_due_cards(user_id, db)
        return [
            {
                'id': card.id,
                'word': card.word,
                'translation': card.translation,
                'example': card.example,
                'status': card.status,
            }
            for card in cards
        ]


@mcp.tool()
async def get_deck_stats(user_id: int) -> dict:
    """Return the user's deck stats: total cards, due today, learned, forgotten, retention rate."""
    async with AsyncSessionLocal() as db:
        return await crud_card.get_learning_stats(user_id, db)


@mcp.tool()
async def add_card(user_id: int, word: str, translation: str) -> dict:
    """Add a new word to the user's flashcard deck."""
    async with AsyncSessionLocal() as db:
        try:
            card = await crud_card.create_card(
                CardCreate(word=word, translation=translation), user_id, db
            )
        except AppError as exc:
            return {'error': exc.code, 'message': exc.message}

        return {
            'id': card.id,
            'word': card.word,
            'translation': card.translation,
            'status': card.status,
        }
