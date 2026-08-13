from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router_achievement import router_achievement
from app.api.router_ai import router_ai
from app.api.router_content import router_grammar, router_vocabulary
from app.api.router_course import router_course
from app.api.router_deck import router_deck, router_learning, router_reviews
from app.api.router_export import router_export
from app.api.router_lingo import router_lingo
from app.api.router_notification import router_notification
from app.api.router_payment import router_payment, router_payments_history, router_stripe
from app.api.router_practice import router_practice
from app.api.router_profile import router_profile
from app.api.router_rating import router_rating
from app.api.router_search import router_search
from app.api.router_settings import router_settings
from app.api.router_social import router_social
from app.api.router_story import router_stories
from app.api.router_streak import router_streak
from app.api.router_subscription import router_subscription
from app.api.router_telegram import router_telegram
from app.api.router_user_story import router_user_story
from app.core.errors import register_exception_handlers
from app.models import (
    model_achievement,
    model_ai_chat,
    model_card,
    model_content,
    model_lingo,
    model_notification,
    model_payment,
    model_profile,
    model_rating,
    model_settings,
    model_social,
    model_subscription,
    model_user,
    model_user_story,
)
from app.services import ai_mcp


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ai_mcp.connect()
    yield
    await ai_mcp.disconnect()


app = FastAPI(title='Glossa 🌍 — Language Learning API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

register_exception_handlers(app)
app.include_router(router_deck)
app.include_router(router_reviews)
app.include_router(router_learning)
app.include_router(router_course)
app.include_router(router_practice)
app.include_router(router_profile)
app.include_router(router_settings)
app.include_router(router_vocabulary)
app.include_router(router_grammar)
app.include_router(router_stories)
app.include_router(router_social)
app.include_router(router_achievement)
app.include_router(router_streak)
app.include_router(router_ai)
app.include_router(router_rating)
app.include_router(router_subscription)
app.include_router(router_payment)
app.include_router(router_stripe)
app.include_router(router_payments_history)
app.include_router(router_user_story)
app.include_router(router_notification)
app.include_router(router_telegram)
app.include_router(router_export)
app.include_router(router_lingo)
app.include_router(router_search)


@app.get('/health')
async def health():
    return {'status': 'ok'}
