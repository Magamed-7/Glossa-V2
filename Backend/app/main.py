from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router_content import router_grammar, router_vocabulary
from app.api.router_deck import router_deck, router_learning, router_reviews
from app.api.router_profile import router_profile
from app.api.router_settings import router_settings
from app.api.router_story import router_stories
from app.core.errors import register_exception_handlers
from app.models import (  # noqa: F401
    model_card,
    model_content,
    model_profile,
    model_settings,
    model_social,
    model_user,
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


@app.get('/health')
async def health():
    return {'status': 'ok'}
