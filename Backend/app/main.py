from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router_profile import router_profile
from app.api.router_settings import router_settings
from app.core.errors import register_exception_handlers
from app.models import model_profile, model_settings, model_user  # noqa: F401

app = FastAPI(title='Glossa 🌍 — Language Learning API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

register_exception_handlers(app)
app.include_router(router_profile)
app.include_router(router_settings)


@app.get('/health')
async def health():
    return {'status': 'ok'}
