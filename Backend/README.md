# Glossa Backend

Language-learning platform backend: spaced repetition (SM-2), leveled reading content (CEFR A1-C1),
user-written stories with a marketplace, social features, subscriptions/payments, and an AI conversation
partner over WebSocket and Telegram.

Split across two frameworks by design, not by accident: **Django** owns authentication and the `users` table
(battle-tested auth, admin panel, 2FA), **FastAPI** owns every other domain (async-first, matches the
read-heavy/high-concurrency shape of the rest of the product). They share one PostgreSQL database and one
JWT secret; FastAPI never writes to `users`, Django never reads the FastAPI-owned tables.

## Architecture

```
client (future frontend / Telegram)
   │ JWT (issued by Django, HS256, shared JWT_SECRET_KEY)
   ├──► django_app :8001        /api/auth/*   (register, login, refresh, me, 2FA, /admin)
   ├──► fastapi_main :8000      /*            (all domain modules, validates JWT itself)
   └──► fastapi_websocket :8002 /ws/ai/chat   (JWT in query string, limits enforced from Redis)

fastapi_main ──► PostgreSQL   (all tables; `users` is read-only here, Django owns writes)
fastapi_main ──► Redis DB 0   (rate limits, event streams, pub/sub)
fastapi_main ──► Redis DB 1   (Celery broker + result backend)
fastapi_main ──► Elasticsearch (full-text search over stories/vocabulary)
fastapi_main ──► MinIO         (avatars, story covers, pronunciation audio)
fastapi_main ──► MCP subprocess (tool-calling for the AI chat: progress, recommendations, texts, exercises)

Celery workers (priority/content/notifications/ai/analytics/payments queues) + Celery beat
Redis Streams consumers (ai/analytics/payments/content) — event-driven side effects, Celery is the fallback
  path when a stream publish fails, not the primary path
telegram_bot ──► same PostgreSQL/Redis, AI chat also available here for premium users with telegram_access
```

Two independent migration systems on one database, on purpose: Django migrations own `users` only
(`auth_service/users/migrations/`), Alembic owns everything else (`alembic/versions/`). They must run in that
order — Alembic's tables have foreign keys into `users`, so an Alembic migration on an empty database fails
if Django hasn't created `users` first.

## Tech stack

Python 3.11 · FastAPI + SQLAlchemy 2 (async, asyncpg) + Alembic · Django 5 + DRF + SimpleJWT (auth only) ·
PostgreSQL 16 · Redis 7 (rate limits, cache, Celery broker/backend, event streams) · Celery 5 · Elasticsearch
8 · MinIO (S3-compatible object storage) · Stripe (card top-ups) · aiogram 3 (Telegram bot) · pyotp (TOTP 2FA)
· pytest + pytest-asyncio (integration tests over a real Postgres/Redis, no mocks).

## Quick start — Docker

```bash
cp .env.example .env   # fill in JWT_SECRET_KEY, MINIO_ROOT_PASSWORD, LLM_API_KEY, etc. — see table below
docker compose up -d                    # core only: postgres, redis, django_app, fastapi_main, fastapi_websocket
docker compose --profile full up -d     # everything: + elasticsearch, minio, celery workers/beat, stream
                                         #   consumers, telegram_bot
```

Then, on a fresh database:

```bash
docker compose exec django_app python manage.py migrate     # creates `users` — must run first
docker compose exec fastapi_main alembic upgrade head        # creates everything else
docker compose exec fastapi_main python seeds/seed_plans.py
docker compose exec fastapi_main python seeds/seed_achievements.py
docker compose exec fastapi_main python seeds/load_content.py --level A1   # repeat per level, A1..C1
```

`docker compose up` alone only starts the core five services (`profiles: ['full']` gates the rest) — a full
`--profile full` run is 17 containers plus an Elasticsearch JVM heap and needs several GB of free RAM; on a
constrained machine, run core + `docker compose up -d elasticsearch minio` selectively instead of the whole
profile at once.

- API docs (Swagger): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Quick start — local (no Docker)

Requires a local PostgreSQL 16 and Redis 7 reachable at the hosts/ports in `.env`.

```bash
python -m venv .venv
.venv/Scripts/activate        # .venv/bin/activate on Linux/Mac
pip install -r requirements.txt
cp .env.example .env          # DATABASE_URL/REDIS_URL default to localhost

python auth_service/manage.py migrate
alembic upgrade head
python seeds/seed_plans.py
python seeds/seed_achievements.py

python auth_service/manage.py runserver 8001                  # Django auth
uvicorn app.main:app --reload --port 8000                     # FastAPI main API
uvicorn websocket_app.main:app --reload --port 8002            # WebSocket AI chat
celery -A app.celery_app worker --loglevel=info                # optional: background tasks
python -m telegram_bot.bot                                     # optional: Telegram bot
```

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | FastAPI, Celery | Full asyncpg DSN — the FastAPI side reads this directly, it does **not** assemble a URL from `DB_HOST`/`DB_PORT` |
| `DB_HOST`, `DB_PORT` | Django | Django settings assemble the DSN from these instead |
| `POSTGRES_DB/USER/PASSWORD/PORT` | docker-compose | Container Postgres credentials/port (defaults to host port `5433` to avoid clashing with a native Postgres on `5432`) |
| `REDIS_URL` | FastAPI, Django, Celery broker | `redis://:<password>@host:6379/0` — DB 0. Celery uses DB 1, hardcoded in `docker-compose.yml`. Must include the same password as `REDIS_PASSWORD` |
| `REDIS_PASSWORD` | docker-compose (`redis` service + every service's `REDIS_URL`/`CELERY_*_URL`) | Redis `--requirepass` — required, no default |
| `JWT_SECRET_KEY`, `JWT_ALGORITHM` | Django (issues), FastAPI (validates) | Must be identical on both sides — this is the entire trust contract between the two services. **No default** — both services fail to start if unset |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | Django | JWT lifetimes |
| `DEBUG` | Django | Defaults to `False` if unset. Local dev sets it `True` explicitly in `.env` |
| `ALLOWED_HOSTS` | Django | Comma-separated. Defaults to `localhost,127.0.0.1` if unset — set to your real domain(s) once deployed |
| `MINIO_ROOT_USER/PASSWORD`, `MINIO_ENDPOINT`, `MINIO_PUBLIC_ENDPOINT` | FastAPI, minio_init | Object storage credentials; `_PUBLIC_ENDPOINT` is what gets embedded in URLs returned to clients |
| `TG_BOT`, `TELEGRAM_BOT_USERNAME` | telegram_bot, FastAPI (link flow) | Bot token and @username for the account-linking deep link |
| `BASE_URL` | Django | Used to build absolute links in verification emails |
| `CORS_ORIGINS` | FastAPI, Django | Comma-separated allowed origins for browser requests. FastAPI (`app/main.py`) is currently wide open (`*`) for development — **narrow before production**. Django (`auth_service`, via `django-cors-headers`) enforces this list strictly (defaults to `http://localhost:5173` if unset) — without it, or without the frontend's real origin included, browsers block every login/register/refresh call with a CORS error, not just a wrong port |
| `EMAIL_HOST*`, `DEFAULT_FROM_EMAIL` | Django | SMTP for email verification |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL` | FastAPI | Card top-ups via Stripe Checkout |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | FastAPI, telegram_bot | OpenAI-compatible endpoint for the AI conversation partner (Groq by default) |
| `ELASTICSEARCH_URL` | FastAPI, consumer_content | Full-text search over stories/vocabulary |
| `ELASTIC_PASSWORD` | FastAPI (`es_client`), docker-compose (`elasticsearch` service) | Basic auth password for the `elastic` user — Elasticsearch runs with `xpack.security.enabled: true` |

## Database: migrations and seeds

Run Django before Alembic on a fresh database — Alembic's tables have foreign keys into `users`:

```bash
python auth_service/manage.py migrate    # or: docker compose exec django_app python manage.py migrate
alembic upgrade head                     # or: docker compose exec fastapi_main alembic upgrade head
```

Seeds (idempotent — safe to re-run, skip rows that already exist):

```bash
python seeds/seed_plans.py           # free/premium/pro plans (prices, limits — see test_limits.py for exact values)
python seeds/seed_achievements.py    # 17 achievement definitions
python seeds/load_content.py --level A1   # reading content: A1, A2, B1, B2, C1 (repeat per level)
python seeds/reindex_es.py           # rebuild the Elasticsearch index from Postgres, once ES is up
```

**Known gap:** `--level C2` is not usable — no C2 source material exists under `contents/` (only
A1 through C1 are prepared). Running it as-is would silently load A1 text mislabeled as C2. Tracked in
`Plan/bugs.md` #2; needs real C2 material before it can be seeded honestly.

## Tests

```bash
python -m pytest tests/ -v
```

Integration tests against a real PostgreSQL and Redis — no mocks. Each test runs inside a savepoint that is
rolled back afterward (`tests/conftest.py`), so nothing persists; Redis-backed rate-limit keys are the one
exception (they're keyed per randomly generated test user, so they don't collide, but they aren't cleaned
up — harmless, they expire on their own via TTL). Requires both Postgres and Redis reachable via the URLs in
`.env` before running.

| File | Covers |
|---|---|
| `test_health.py` | Smoke test for `/health` |
| `test_auth.py` | JWT validation: missing/garbage/valid/deactivated-account tokens |
| `test_profiles.py` | Profile privacy toggles (fields disappear from the response, not just null out) |
| `test_sm2.py` | SM-2 spaced-repetition algorithm, table-driven, hand-computed expected values |
| `test_reviews.py` | Review submission end-to-end: due list, SM-2 application, unknown card |
| `test_payments.py` | Wallet top-up, subscriptions, purchase atomicity (rollback on failure), 70/30 marketplace split |
| `test_limits.py` | Plan limit enforcement at the exact threshold: deck words/day, stories/day, own stories/week, B2+ writer gate, AI seconds/day |

## API overview

Auth (Django, `django_app`, prefix `/api/auth`):

| Method | Path | Notes |
|---|---|---|
| POST | `/register`, `/login` | `/login` returns tokens directly, or `{requires_2fa, pending_token}` if 2FA is enabled |
| POST | `/login/2fa` | Exchanges `pending_token` + TOTP/backup code for real tokens |
| POST | `/refresh` | SimpleJWT refresh |
| GET/PATCH/DELETE | `/me` | Profile fields / soft account deactivation (`is_active=False`, not a hard delete — FastAPI tables hold FKs into `users`) |
| POST | `/change-password` | |
| POST | `/verify-email`, `/verify-email/resend` | |
| POST | `/2fa/setup`, `/2fa/confirm`, `/2fa/disable` | TOTP, opt-in, user-controlled only |

All domain APIs (FastAPI, `fastapi_main`, no prefix beyond the router's own):

| Tag | Base path | Covers |
|---|---|---|
| Deck / Reviews / Learning | `/deck`, `/reviews`, `/learning` | Flashcards, SM-2 review queue, stats |
| Profile / Settings | `/profile`, `/settings` | Public/private profile, privacy toggles, app settings |
| Vocabulary / Grammar | `/vocabulary`, `/grammar` | Leveled reference content, grammar quizzes with weak-topic tracking |
| Stories | `/stories` | Curated leveled reading, reading progress, comprehension questions |
| User Stories | `/user-stories` | Author flow (B2+ gate, weekly limit), publish, buy (70/30 split), exercises, reviews |
| Social | `/social` | Follow/followers/friends |
| Achievements / Leaderboard | `/achievements`, `/leaderboard` | Unlocks, global/weekly rankings |
| AI | `/ai` | Async exercise generation, personal error log (chat itself is WebSocket, see below) |
| Subscriptions / Payments | `/subscriptions`, `/balance`, `/payments`, `/stripe` | Plans, wallet, top-up (manual or Stripe Checkout), purchase history |
| Notifications | `/notifications` | List, mark read |
| Telegram | `/telegram` | Account-linking code exchange |
| Export | `/export/me` | Full personal-data dump across every domain |
| Search | `/search` | Elasticsearch-backed story/vocabulary search |

Errors are always `{"error": {"code": "SOME_CODE", "message": "...", "status": <int>}}` — see
`app/core/errors.py`. Pagination is `limit`/`offset` query params on list endpoints, default `limit=20`.

### WebSocket AI chat (`fastapi_websocket`, `/ws/ai/chat`)

Query params: `token` (JWT, required), `scenario` (default `casual`), `language` (default `English`).

1. Server sends `{"type": "session_started", "session_id": ...}` on connect.
2. Client sends `{"text": "..."}` per message.
3. Server replies `{"type": "message", "reply": "...", "corrections": [...]}`.
4. Every second of open connection counts against the plan's `ai_seconds_per_day` limit; on exhaustion the
   server sends `{"type": "limit_reached", ...}` and closes with code `4403`.
5. Close code `4401` = missing/invalid token. `4403` = no AI access on the current plan, or limit reached.

Free plan has `ai_seconds_per_day = 0` (no AI access at all); premium gets 9000s/day (2.5h); pro is unlimited.

## Known limitations

- **CEFR C2 content** (`Plan/bugs.md` #2): no source material exists yet; `--level C2` must not be run as-is.
- **`--profile full` docker-compose** has not been verified running all 17 containers simultaneously on this
  machine (insufficient RAM for Postgres + Redis + Elasticsearch + 12 workers/consumers at once) — the core
  profile (5 services) and the full profile's individual services have each been verified live, just not all
  at once. The compose config itself doesn't differ mechanically between the two.
- **CORS is wide open** (`allow_origins=['*']`) — intentional for development, must be narrowed to real
  frontend origins before any production deployment.
- **`POST /balance/topup`** credits a user's wallet with no real payment — any authenticated user can top up
  an arbitrary amount for free, fully spendable including real 70% payouts to story sellers. Not fixed —
  needs an owner decision on whether to remove the endpoint entirely or gate it behind an admin/service role.
  See `Plan/bugs.md` #4.
- A full security audit of the backend (2026-07-31, `Plan/bugs.md` #3–#18) found and fixed most of what it
  found: IDOR on deck-card endpoints, missing upload content-type/size validation, refresh tokens usable as
  access tokens, an insecure JWT secret fallback, missing Stripe webhook idempotency, Redis/Elasticsearch
  running without authentication, no rate-limiting on login/2FA, insecure Django `DEBUG`/`ALLOWED_HOSTS`
  defaults, root containers, registration user-enumeration, a Telegram link-code race, and prompt-injection
  hardening on the AI chat's `language` parameter. Elasticsearch's auth was wired through config but not
  verified against a live cluster (not in the core Docker profile on this machine). See `Plan/bugs.md` for
  exactly what changed and how each fix was verified.
