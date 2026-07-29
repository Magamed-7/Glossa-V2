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

### 1.9. JWT-хелперы FastAPI
- `Backend/app/core/security.py` — `oauth2_scheme` (`OAuth2PasswordBearer`, `auto_error=False`), `decode_access_token()` через `python-jose` с `settings.JWT_SECRET_KEY`/`JWT_ALGORITHM`. FastAPI здесь **только валидирует** — выдачей токенов занимается Django (фаза 2), поэтому в отличие от `Bon Appetit/security.py` тут нет `hash_password`/`create_access_token`.
- Проверено вживую: токен, подписанный тем же `JWT_SECRET_KEY`, декодируется; просроченный и мусорный токен → `None`.

**Фаза 1 закрыта**: `uvicorn app.main:app`, `/health`, `/docs`, postgres+redis (докер на 5433/6379 + нативный postgres на 5432 с уже готовой `GlossaV2`), alembic, redis-клиент и JWT-валидация — всё проверено вживую.

## Фаза 2 — Django auth-сервис

### 2.1. Скелет Django-проекта
- `Backend/auth_service/manage.py`, `auth_service/auth_service/{settings.py,urls.py,wsgi.py,asgi.py}` — стандартный `django-admin startproject`.
- `settings.py`: `SECRET_KEY` = `JWT_SECRET_KEY` из общего `.env` (тот же секрет, которым FastAPI validates JWT), `DATABASES` — postgres через `psycopg2`, читает `POSTGRES_DB/USER/PASSWORD` + новые `DB_HOST=localhost`/`DB_PORT=5432` (специально отдельно от `POSTGRES_PORT=5433`, который остаётся портом **докеровского** postgres из шага 1.6 — Django и FastAPI оба смотрят на нативный инстанс на 5432, где уже лежит `GlossaV2`).
- `Backend/requirements.txt` пополнен: `django`, `djangorestframework`, `djangorestframework-simplejwt`, `psycopg2-binary`.
- Проверено вживую: `manage.py check` — чисто; `manage.py runserver 8011` (мой тестовый порт) — `/admin/login/` отдаёт 200.

### 2.2. Кастомная модель пользователя
- `auth_service/users/models.py` — `User(AbstractUser)`: `email` уникальный, `role` (`student`/`author`/`admin`, дефолт `student`), `is_verified`, `created_at`; `Meta.db_table = 'users'` — под именем таблицы, которое позже read-only мапит FastAPI (шаг 2.9).
- `settings.py`: `'users'` в `INSTALLED_APPS`, `AUTH_USER_MODEL = 'users.User'`.
- Проверено вживую: `manage.py makemigrations users` сгенерировал `0001_initial.py` без ошибок (сам файл коммитится отдельно в 2.3).

### 2.3. Миграции пользователей
- `auth_service/users/migrations/0001_initial.py` + стандартные django-миграции (contenttypes/auth/admin/sessions).
- Проверено вживую: `manage.py migrate` на нативной `GlossaV2` — применились все 19 миграций; таблица `users` создана с колонками `id/password/.../role/is_verified/created_at`. Побочный эффект: `alembic_version` и наша `users` теперь соседствуют в той же БД с django-таблицами (`auth_*`, `django_*`) — это и есть общая БД из A.5.1, границы владения зафиксируются в 2.10.

### 2.4. DRF + SimpleJWT
- `settings.py`: `rest_framework`/`rest_framework_simplejwt` в `INSTALLED_APPS`, `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES = JWTAuthentication`, `SIMPLE_JWT` — `HS256`, `SIGNING_KEY=JWT_SECRET_KEY` из env (тот же секрет, что декодирует FastAPI, см. 1.9), `USER_ID_CLAIM='user_id'`, access 30 мин / refresh 7 дней из env.
- Проверено вживую (через `manage.py shell`, ещё без урлов — те появятся в 2.5/2.6): `RefreshToken.for_user()` выдал access-токен, вручную декодированный тем же `SIGNING_KEY` — в payload есть `user_id`.

### 2.5. Регистрация
- `auth_service/users/serializers.py` — `RegisterSerializer`: `username`/`email` объявлены явно с `validators=[]` (иначе DRF's `UniqueValidator` перехватывает раньше моих `validate_*` и даёт родовой текст), свои `validate_email`/`validate_username` с текстами **один в один как Green Shop** (`'Email already exists'`, `'Username already exists'`), `create()` зовёт `User.objects.create_user(...)` — пароль хешируется штатным Django-механизмом.
- `users/views.py` (`RegisterView`, `CreateAPIView`, `AllowAny`), `users/urls.py` (`POST register`), подключено в `auth_service/urls.py` под `api/auth/`.
- Проверено вживую: `POST /api/auth/register` создаёт пользователя (пароль в БД — хеш, не plain text), повторный email/username → 400 с текстами выше.

### 2.6. Логин и refresh
- `users/urls.py` — `POST login` → `TokenObtainPairView` (стандартный SimpleJWT, поле логина — `username`), `POST refresh` → `TokenRefreshView`.
- Проверено вживую: логин по username+password → `{access, refresh}`; `refresh` с валидным refresh-токеном → новый `access` (200); неверный пароль → 401 `"No active account found with the given credentials"`.

### 2.7. Эндпоинт me
- `users/views.py` (`MeView`, `RetrieveAPIView`, `IsAuthenticated`, `get_object` возвращает `request.user`), `GET me` в `users/urls.py`.
- Проверено вживую: с access-токеном → `id/username/email/role/is_verified/created_at`; без токена → 401.

### 2.8. Админка
- `users/admin.py` — `GlossaUserAdmin(UserAdmin)`: список с `role`/`is_verified`/`is_staff`, фильтры, доп. fieldset `Glossa` поверх стандартных полей `UserAdmin`.
- `auth_service/README.md` — инструкция `python manage.py createsuperuser`.
- Проверено вживую: суперюзер создан, логин в `/admin/` проходит, `/admin/users/user/` (список пользователей) отдаёт 200.

### 2.9. Users-модель и get_current_user в FastAPI
- `Backend/app/models/model_user.py` — `Users`, `__tablename__='users'`, read-only маппинг на django-таблицу (только нужные колонки: id/username/email/role/is_verified/is_active/created_at — таблица шире, лишние колонки Django не мапятся, и это не проблема, т.к. Alembic ею не владеет).
- `Backend/app/services/crud_user.py` — `get_by_id`.
- `Backend/app/api/auth.py` — `get_current_user`: `oauth2_scheme` → `decode_access_token` → **`payload['user_id']`** (не `sub` — это claim, который реально кладёт наш `SIMPLE_JWT.USER_ID_CLAIM` из шага 2.4) → `crud_user.get_by_id`.
- `Backend/app/api/permissions.py` — `require_roles(roles)`.
- Заодно (нужно было для 401-ответов вместо `HTTPException`, которого CONVENTIONS.md запрещает): `Backend/app/core/errors.py` — `AppError` + `register_exception_handlers`, подключено в `app/main.py`.
- Проверено вживую (временный роут вне репозитория, `$CLAUDE_JOB_DIR/tmp/tmp_auth_app.py`, не коммитился): без токена → 401 `NOT_AUTHENTICATED`; с реальным access-токеном, выданным Django, → пользователь из общей `users` таблицы; с мусорным токеном → 401 `INVALID_TOKEN`.
