# Прогресс разработки Glossa V2

Один пункт плана (`Plan/IMPLEMENTATION_PLAN.md`, дополнено `Plan/SPEAKING_PLAN.md`) — один коммит. Здесь фиксируется,
что сделано и где искать код, в том же порядке, в котором пишется код — читать сверху вниз.

Слои читать по `docs/CONVENTIONS.md`: `Backend/app/{api,core,db,models,schemas,services}`,
файлы `model_*.py` / `schema_*.py` / `crud_*.py` / `router_*.py`.

---

## Фаза 1 — Каркас проекта

### 1.1. Скелет папок и пустой frontend
- `Backend/app/{api,core,db,models,schemas,services}/__init__.py` — пустые пакеты, слои по CONVENTIONS.md (не `modules/`, как в старом черновике плана — CONVENTIONS.md главнее).
- `Frontend/.gitkeep`, `Frontend/README.md` — фронтенд будет позже, контракт в `docs/FRONTEND_CONTRACT.md` (появится в фазе 16).

### 1.2. Базовые зависимости
- `Backend/requirements.txt` — fastapi/uvicorn/sqlalchemy/asyncpg/alembic/pydantic/python-jose/passlib/python-dotenv/python-multipart/redis, версии зафиксированы через `pip freeze` в `Backend/.venv`.
- `Backend/.gitignore` — .venv/.env/__pycache__/кэши тестов/media/staticfiles/IDE-файлы.

### 1.3. Конфиг и .env.example
- `Backend/app/core/config.py` — класс `Settings`, всё из `os.getenv`, синглтон `settings`. Поля привязаны к уже существующему `Backend/.env` (не менял имена: `JWT_SECRET_KEY`, `TG_BOT`, email-блок), добавил `DB_ECHO` и `REDIS_URL` с рабочими дефолтами.
- `Backend/.env.example` — те же имена переменных, без секретов.

### 1.4. Подключение БД
- `Backend/app/db/database.py` — async engine из `settings.DATABASE_URL`, `AsyncSessionLocal` с `expire_on_commit=False`, `Base`, `get_db()`. Один в один по образцу `Bon Appetit/user-services/app/db/database.py`, только `echo` берётся из `settings.DB_ECHO`, а не хардкодится.

### 1.5. Точка входа FastAPI
- `Backend/app/main.py` — `FastAPI(title='Glossa 🌍 — Language Learning API')`, CORS `allow_origins=['*']` (как в Green Shop), `GET /health` → `{'status': 'ok'}`.
- Проверено вживую: `uvicorn app.main:app` на 8010 (мой тестовый порт, не 8000 — см. привычку из Ometus), `/health` → 200, `/docs` → 200.

### 1.6. Docker: postgres + redis
- `Backend/docker-compose.yml` — сервисы `postgres:16` и `redis:7`, healthcheck, volumes.
- **Важное решение по портам**: на этой машине уже крутится нативный (не-докерный) Postgres как Windows-сервис на 5432 — общий для всех Softclub-экзаменов (в нём видны `books_db`, `users_services_db`, `restaurants_db` и т.д., и **`GlossaV2` там уже создана заранее**). `DATABASE_URL` в `.env` продолжает смотреть на этот нативный инстанс (5432) — трогать его не стал. Чтобы не конфликтовать портом, докеровский postgres в compose слушает **5433** на хосте (`POSTGRES_PORT` в .env/.env.example), redis — как обычно на 6379 (нативного redis на машине нет).
- Проверено вживую: `docker compose up -d postgres redis` — оба healthy; с хоста подключился и к докеровскому postgres (5433), и к redis (6379); нативный postgres (5432, `GlossaV2`) отдельно тоже доступен и именно на него смотрит приложение.

### 1.7. Alembic
- `Backend/alembic.ini`, `Backend/alembic/env.py` (async-вариант по образцу `Bon Appetit/user-services/alembic/env.py`: `target_metadata=Base.metadata`, url из `settings.DATABASE_URL`), `Backend/alembic/script.py.mako`.
- Проверено вживую на нативной `GlossaV2` (пустая на тот момент): `alembic revision --autogenerate -m "empty baseline"` дал пустую миграцию `alembic/versions/88bff8d55a71_empty_baseline.py`, `alembic upgrade head` прошёл, `alembic current` показывает head.

### 1.8. Redis-клиент
- `Backend/app/core/redis_client.py` — `redis.asyncio.from_url(settings.REDIS_URL, decode_responses=True)`, синглтон `redis_client`, `get_redis()` для Depends.
- Проверено вживую: `ping()` к докеровскому redis (6379) → True.
