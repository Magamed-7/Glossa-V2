from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router_achievement import router_achievement
from app.api.router_content import router_grammar, router_vocabulary
from app.api.router_deck import router_deck, router_learning, router_reviews
from app.api.router_payment import router_payment, router_payments_history, router_stripe
from app.api.router_profile import router_profile
from app.api.router_rating import router_rating
from app.api.router_settings import router_settings
from app.api.router_social import router_social
from app.api.router_story import router_stories
from app.api.router_subscription import router_subscription
from app.api.router_user_story import router_user_story
from app.core.errors import register_exception_handlers
from app.models import (  # noqa: F401
    model_achievement,
    model_card,
    model_content,
    model_payment,
    model_profile,
    model_rating,
    model_settings,
    model_social,
    model_subscription,
    model_user,
    model_user_story,
)

app = FastAPI(title='Glossa 🌍 — Language Learning API')

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
app.include_router(router_profile)
app.include_router(router_settings)
app.include_router(router_vocabulary)
app.include_router(router_grammar)
app.include_router(router_stories)
app.include_router(router_social)
app.include_router(router_achievement)
app.include_router(router_rating)
app.include_router(router_subscription)
app.include_router(router_payment)
app.include_router(router_stripe)
app.include_router(router_payments_history)
app.include_router(router_user_story)


@app.get('/health')
async def health():
    return {'status': 'ok'}
