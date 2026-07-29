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

### 2.10. Исключение django-таблиц из Alembic
- `Backend/alembic/env.py` — импортирует `app.models.model_user` (чтобы `users` реально попала в `target_metadata`, иначе тест ничего не проверял бы), `include_object` фильтрует `type_=='table'` с именем `users` или префиксом `users_`/`django_`/`auth_`/`token_blacklist_`.
- `docs/CONVENTIONS.md` — раздел «границы владения таблицами» дополнен списком реальных префиксов.
- Проверено вживую (и это поймало реальный баг в первой версии фильтра!): без префикса `users_` autogenerate предлагал **дропнуть** `users_groups`/`users_user_permissions` — m2m-таблицы Django для кастомной модели называются по `app_label` (`users`), а не по `db_table` (`users` уже занято самой моделью), так что `users_groups` ≠ `db_table='users'`. После добавления префикса `alembic revision --autogenerate` на БД с django-таблицами и мапленной `Users` даёт пустую миграцию; `alembic upgrade head` проходит.

### 2.11. Django в docker-compose
- `Backend/docker/Dockerfile.django` — `python:3.12-slim`, ставит `requirements.txt`, рабочая директория для CMD — `auth_service/`, `manage.py runserver 0.0.0.0:8001`.
- `Backend/docker-compose.yml` — сервис `django_app`: `env_file: .env`, **но** `DB_HOST=host.docker.internal`/`DB_PORT=5432` переопределены в environment — контейнер должен достучаться до **нативного** postgres на хосте (не до докеровского на 5433, у которого нет реальных данных), отсюда `extra_hosts: host.docker.internal:host-gateway`. `depends_on: postgres` (докеровский, healthcheck) оставлен как в плане — для сценария полного докер-стека без нативного postgres (фаза 16).
- `Backend/.dockerignore` — добавлен (не было в плане явно, но без него `COPY . .` затащил бы `.env` с секретами в образ); по образцу `Bon Appetit/user-services/.dockerignore`.
- Проверено вживую: `docker compose build django_app` + `up -d` — контейнер поднялся; `POST /api/auth/register` и `/api/auth/login` **через контейнер на 8001** отработали и записали пользователя в ту же нативную `GlossaV2`.

**Фаза 2 закрыта**: Django auth-сервис — регистрация/логин/refresh/me/admin — работает и нативно, и в докере, JWT читается FastAPI из общей `users` таблицы, Alembic таблицы Django не трогает.

## Фаза 3 — Пользователи, профили, приватность, настройки

### 3.1. Модель профиля
- `Backend/app/models/model_profile.py` — `UserProfiles` (`user_id` уникальный FK на `users.id`, `bio`, `interests` JSON/JSONB, `photo_url`, `profile_views` default 0), `UserLanguages` (`user_id` FK, `language`, `level` дефолт `'A1'`, `is_target` default True). Оба в одном файле — связанные, как разрешает CONVENTIONS §1.
- `app/main.py` — `from app.models import model_profile, model_user` (регистрирует таблицы в `Base.metadata` по факту импорта).
- Проверено вживую: `Base.metadata.tables` видит `user_profiles`, `user_languages`, `users`.

### 3.2. Миграция профиля
- `Backend/alembic/versions/25fbdf417bc9_create_user_profiles_tables.py` — `user_languages` + `user_profiles` (уникальный индекс на `user_profiles.user_id`).
- `alembic/env.py` пополнен импортом `model_profile`.
- Проверено вживую: `upgrade head` создал обе таблицы; `downgrade -1` откатил; `upgrade head` снова накатил без ошибок.

### 3.3. Схемы профиля
- `Backend/app/schemas/schema_profile.py` — `ProfileUpdate` (всё Optional), `LanguageAdd`/`LanguageResponse`, `ProfileResponse`, `PublicProfileResponse`.
- **Отступление от буквы плана**: `PublicProfileResponse` пока **без** `current_streak`/`best_streak`/`followers_count` — этих данных ещё физически нет (стрики и подписчики появятся в фазах 6/7). Тумблеры `ProfilePrivacy` под них всё равно будут созданы в 3.8 один в один по плану (готовим API заранее), а сами поля в паблик-профиль допишу, когда появятся модели. `profile_views` не гейтится тумблером — его нет в списке приватности плана, значит поле безусловное.
- Проверено вживую: `ProfileUpdate()` — все None; `LanguageAdd(language='English')` — дефолт `level='A1'`; `level='Z9'` — `ValidationError` (не входит в `CEFR_LEVELS`).

### 3.4. CRUD профиля
- `Backend/app/services/crud_profile.py` — `get_profile` (автосоздание, если записи ещё нет), `update_profile` (паттерн `or`), `increment_profile_views`, `add_language`, `get_user_languages`.
- Проверено вживую на реальном пользователе (`crudtest`, id=9, потом удалён): автосоздание профиля → `update_profile(bio=...)` → `add_language('English', 'B2')` → `get_user_languages` вернул её → `increment_profile_views` довёл `profile_views` до 1.

### 3.5. Роуты профиля
- `Backend/app/api/router_profile.py` — `router_profile` (`prefix='/profile'`), `GET/PATCH /profile/me`, `POST /profile/languages`; подключён в `app/main.py`.
- Проверено вживую через `uvicorn` + реальный Django-токен: `GET /profile/me` автосоздаёт профиль (200), `PATCH /profile/me` обновляет bio/interests, `POST /profile/languages` добавляет язык — первый рабочий домен FastAPI поверх django-аутентификации.
- Попутный урок про окружение: зависший процесс от предыдущего теста Phase 1 (порт 8010, не убитый `kill %1` из другого вызова Bash — фоновые джобы не всегда переживают между вызовами тула) отдавал старый `/health`-only роутер и маскировал 404 — нашёл через `netstat`/`taskkill`, держу в уме на будущее.

### 3.6. MinIO и storage-клиент
- `docker-compose.yml` — сервис `minio` (консоль на 9001, API на 9000, healthcheck `mc ready`) + одноразовый `minio_init` (`minio/mc`), который создаёт бакеты `avatars`/`story-images`/`pronunciations` и включает на них публичное скачивание (`mc anonymous set download`) — фото/аудио должны открываться по прямой ссылке без подписи.
- `.env`/`.env.example` — `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`/`MINIO_ENDPOINT`/`MINIO_PUBLIC_ENDPOINT`; `config.py` их читает.
- `Backend/app/core/storage.py` — `boto3` S3-клиент на `MINIO_ENDPOINT`, `upload_file(bucket, bytes, filename, content_type)` (ключ = `uuid_имя`, чтобы не было коллизий), `get_file_url`.
- `requirements.txt` пополнен `boto3`.
- Проверено вживую: `docker compose up -d minio minio_init` — бакеты созданы (лог `minio_init` подтверждает все три + права на скачивание); `upload_file('avatars', ...)` вернул URL, `curl` по нему отдал загруженное содержимое (200).

### 3.7. Загрузка фото профиля
- `router_profile.py` — `POST /profile/me/photo` (`UploadFile` → `storage.upload_file('avatars', ...)` → `crud_profile.update_photo`), объявлен **до** `/profile/languages` и на будущее — до параметризованного `/profile/{user_id}` из 3.9 (правило CONVENTIONS §7 про порядок роутов).
- `crud_profile.py` — `update_photo`.
- Проверено вживую: `POST /profile/me/photo` (multipart) с реальным Django-токеном — файл лёг в бакет `avatars`, `photo_url` сохранён в профиле, по этому URL файл открывается напрямую (200).
- Попутный урок про инструменты: у здешнего `curl` при `-F file=@путь` POSIX-путь `/tmp/...` не резолвится (`curl: (26) Failed to open/read local data`) — с Windows-путём (`C:\Users\...`) работает; держу это в уме для файловых загрузок дальше по плану (аудио произношения, аватары историй).

### 3.8. Гранулярная приватность
- `app/models/model_profile.py` — `ProfilePrivacy` (`user_id` уникальный FK, 7 Boolean-тумблеров, все default True): `show_stories_count/achievements/current_streak/best_streak/languages/language_levels/followers`.
- `schema_profile.py` — `PrivacyUpdate` (всё Optional), `PrivacyResponse`.
- `crud_profile.py` — `get_privacy` (автосоздание), `update_privacy` — **не** паттерн `or`, а `if data.field is not None` на каждый тумблер (CONVENTIONS §5: `False` — валидное значение, `or` бы его затирал).
- `router_profile.py` — `GET/PATCH /profile/me/privacy`.
- Миграция `alembic/versions/5ff1cd938342_add_granular_profile_privacy_settings.py`.
- Проверено вживую: `GET` на новом пользователе — все 7 тумблеров `true` (автосоздание с дефолтами); `PATCH {"show_achievements": false, "show_followers": false}` — только эти два стали `false`, остальные пять остались `true`.

### 3.9. Публичный профиль с фильтром приватности
- `schema_profile.py` — `LanguageResponse.level` стал `str | None = None` (нужно, чтобы можно было выдать язык без уровня, когда `show_language_levels=False`).
- `crud_profile.py` — `get_public_profile(user_id, viewer_id, db)`: собирает `username` из `Users` + профиль + приватность; если смотрящий ≠ владелец — инкремент `profile_views`; собирает **обычный dict**, а не строгую pydantic-модель — так поля реально отсутствуют, а не `null` (`languages` добавляется в dict только если `show_languages`; внутри каждого языка `level` — `None`, если `show_language_levels` выключен).
- `router_profile.py` — `GET /profile/{user_id}` (параметризованный, объявлен **последним** — после `/me`, `/me/photo`, `/me/privacy`, `/languages`, как требует CONVENTIONS §7), `response_model=PublicProfileResponse, response_model_exclude_none=True` — вот этот флаг и превращает `None` в реально отсутствующий ключ JSON; 404 `USER_NOT_FOUND`, если id не существует.
- **Отступление от буквы плана** (см. заметку в 3.3): тумблеры `show_stories_count/achievements/current_streak/best_streak/followers` в БД есть и читаются/переключаются, но в `get_public_profile` пока нечего под них подставлять — этих данных ещё нет в системе (появятся в фазах 4/6/7). Функция готова принять эти поля без изменения контракта, когда они появятся.
- Проверено вживую (два реальных пользователя, `pubtarget`/`pubviewer`): viewer посмотрел профиль target → `profile_views: 0→1`, отдал `bio`, но **без** `level` у языка (спрятан тумблером) и без `interests`/`photo_url` (просто нет ключей, они `None`); target посмотрел свой же профиль через тот же паблик-эндпоинт → `profile_views` не увеличился (просмотр себя не считается); несуществующий `user_id` → 404 `USER_NOT_FOUND`.

### 3.10. Модель пользовательских настроек
- `Backend/app/models/model_settings.py` — `UserSettings` (`user_id` уникальный FK): обучение (`target_language`, `daily_goal` default 10, `study_time`, `difficulty` default `'medium'`), уведомления (`email_enabled`/`push_enabled` default True, `telegram_enabled` default **False** — привязки телеграма ещё нет, появится в фазе 12, `reminder_time`), соц. (`ratings_enabled` default True, `profile_visible` default True).
- Миграция `alembic/versions/7bd514e8c553_add_user_settings_model.py`, импорт в `main.py`/`alembic/env.py`.
- Проверено вживую: `upgrade head` создал `user_settings` с дефолтами.

### 3.11. Эндпоинты настроек
- `Backend/app/schemas/schema_settings.py` — `SettingsUpdate` (всё Optional), `SettingsResponse`.
- `Backend/app/services/crud_settings.py` — `get_settings` (автосоздание), `update_settings` (`or` для строк/чисел, `is not None` для Boolean-тумблеров — та же логика, что в приватности).
- `Backend/app/api/router_settings.py` — `GET/PATCH /settings/me`, подключено в `main.py`.
- Проверено вживую: `GET /settings/me` на новом пользователе — автосоздание с дефолтами (`daily_goal=10`, `difficulty='medium'`, `telegram_enabled=false`, остальные тумблеры `true`); `PATCH {"daily_goal":25,"telegram_enabled":true}` — только эти два поля изменились, остальные не тронуты.

**Фаза 3 закрыта**: профиль, языки, гранулярная приватность с публичным профилем (поля реально отсутствуют, а не `null`), фото через MinIO, настройки — всё поверх django-аутентификации, всё проверено вживую через реальные HTTP-запросы к `uvicorn`.

## Фаза 4 — Ядро обучения и SM-2

### 4.1. Модели карточек
- `Backend/app/models/model_card.py` — `Cards`: `word`/`translation`/`example`/`audio_url`, `status` default `'learning'`, `source_story_id` (nullable, для будущей привязки к пользовательским историям фазы 10), поля SM-2 — `ease_factor` default 2.5, `interval`/`repetitions` default 0, `next_review_date` nullable (новая карточка ещё не проходила ревью), `last_quality` nullable.
- `ReviewLogs` **не** создаю сейчас — по плану она появляется вместе с сервисом ревью в 4.7, хотя они и «связанные» (не стал заранее тащить в этот файл, чтобы не размывать границу шага).
- Проверено вживую: `Base.metadata.tables['cards']` содержит все перечисленные в плане поля.

### 4.2. Миграция карточек
- `Backend/alembic/versions/85c2ff7004b2_create_cards_table.py`.
- Проверено вживую: `upgrade head` создал таблицу, `downgrade -1` откатил, `upgrade head` снова накатил.

### 4.3. Алгоритм SM-2
- `Backend/app/services/sm2.py` — `apply_sm2(ease_factor, interval, repetitions, quality)`, чистая функция без БД, каноническая формула SM-2 (без префикса `crud_`, как алгоритмы в CONVENTIONS §1).
- Проверено вживую табличкой из плана: `q=5` три раза подряд от `ease=2.5,interval=0,repetitions=0` → интервалы `1 → 6 → 16` (третий — `round(6*2.7)`, «EF*»), EF растёт `2.5→2.6→2.7→2.8`; `q=2` после серии успешных — `repetitions` сбрасывается в 0, `interval=1`; повторные `q=0` от `ease=1.3` — EF не проваливается ниже 1.3 (пол работает).

### 4.4. Схемы learning
- `Backend/app/schemas/schema_learning.py` — `CardCreate`, `CardStatusUpdate` (`Literal` статусов), `CardResponse`, `ReviewSubmit` (`quality: int = Field(ge=0, le=5)`), `ReviewResponse`, `LearningStats`.
- Проверено вживую: `quality=7` → `ValidationError`; `quality=5` проходит.

### 4.5. CRUD колоды
- `Backend/app/services/crud_card.py` — `create_card` (проверка дубликата слова у пользователя → `AppError CARD_ALREADY_EXISTS` 400), `get_cards` (kwargs-фильтры: `status`, `search` через `ilike`, пагинация), `get_card`, `update_card_status`, `delete_card`.
- Проверено вживую на реальном пользователе (`cardtest`, id=18): создал `hello`/`world`, повторный `hello` → 400 `CARD_ALREADY_EXISTS`, `search='hel'` нашёл только `hello`, `update_card_status` → `learned`, `delete_card` убрал `world` из списка.

### 4.6. Роуты колоды
- `Backend/app/api/router_deck.py` — `router_deck` (`prefix='/deck'`, `tags=['Deck']` — буквально по образцу из CONVENTIONS §7): `POST/GET /deck`, `GET /deck/{card_id}`, `PATCH /deck/{card_id}/status`, `DELETE /deck/{card_id}`. Подключён в `main.py`.
- Проверено вживую полным циклом через `uvicorn`: create → list → get → update status → delete → get после удаления → 404 `CARD_NOT_FOUND`.

### 4.7. Сервис ревью
- `Backend/app/models/model_card.py` — добавлена `ReviewLogs` (`card_id`, `quality`, `reviewed_at`) — как и планировал в заметке к 4.1, тащу её сюда вместе с сервисом, который её пишет.
- `Backend/app/services/review.py` — `get_due_cards(user_id, db)` (новые карточки `next_review_date IS NULL` **или** просроченные `<= now()`), `submit_review(card_id, quality, db)` (гоняет `sm2.apply_sm2`, обновляет карточку, пишет `ReviewLogs`).
- Миграция `alembic/versions/5d59f9cf8c02_add_review_logs_table.py`.
- Проверено вживую: новая карточка сразу видна в `get_due_cards`; после `submit_review(quality=5)` — `interval=1, repetitions=1`, `next_review_date` ушёл в завтра, `last_quality=5`, и карточка **пропала** из `get_due_cards` (следующая дата в будущем); в `review_logs` появилась строка `(card_id, quality=5)`.

### 4.8. Роуты ревью
- `Backend/app/api/router_deck.py` — добавлен второй роутер в том же файле, `router_reviews = APIRouter(prefix='/reviews', tags=['Reviews'])` (в одном файле с `router_deck` — так же, как план держит колоду и ревью в одном `routes.py`; домен один — «обучение»): `GET /reviews/today`, `POST /reviews/{card_id}` (`ReviewSubmit`). Подключён в `main.py`.
- Проверено вживую: карточка видна в `/reviews/today`; `POST /reviews/{id}` с `quality=4` двигает `next_review_date`; карточка **пропадает** из `/reviews/today` — DoD выполнен буквально.
- Попутный урок: чистка тестовых данных должна идти в порядке FK — сперва `review_logs`/`cards` (владеет FastAPI/Alembic), потом django-пользователь, иначе `IntegrityError` (`cards_user_id_fkey`) — обратный порядок один раз словил на этом шаге.

### 4.9. Статистика обучения
- `crud_card.py` — `get_learning_stats(user_id, db)`: `cards_total`/`due_today` через `func.count()`, `learned_count` по статусу, `forgotten_count`/`retention_rate` по `ReviewLogs` (join на `Cards` через `card_id`, `quality < 3` — забыто, `retention_rate = remembered/total*100`, 0 при отсутствии ревью).
- `router_deck.py` — третий роутер в файле, `router_learning = APIRouter(prefix='/learning', ...)`, `GET /learning/stats`.
- Проверено вживую на сценарии: 3 карточки (`apple`/`banana`/`cherry`), ревью `apple` q=5 (в будущее), `banana` q=1 (забыто), `apple` вручную помечена `learned`, `cherry` не трогали → `GET /learning/stats` = `cards_total=3, due_today=1 (только cherry — никогда не ревьюилась), learned_count=1, forgotten_count=1, retention_rate=50.0` — числа сошлись один в один со сценарием.

### 4.10. Аудио произношения
- `crud_card.py` — `update_audio`. `router_deck.py` — `POST /deck/{card_id}/audio` (`UploadFile` → `storage.upload_file('pronunciations', ...)`).
- Проверено вживую: файл лёг в бакет `pronunciations`, `audio_url` сохранён в карточке и открывается напрямую (200).

**Фаза 4 закрыта**: SM-2 (каноническая формула, проверена табличкой), полный CRUD колоды, цикл ревью с логом, статистика со сходящимися числами, аудио произношения — всё поверх реальной БД и MinIO, всё проверено живыми HTTP-запросами.

## Фаза 5 — Системный контент: словарь, грамматика, истории

**Важно перед этой фазой** — корневой баг V1 ([[glossa-trilingual-audit]]): `pick_locale` в старом проекте выбирал, на каком языке показать **весь текст истории**, по UI-локали (родной язык), а не по языку, который человек учит — история на английском с `?locale=ru` превращалась в полностью русский текст, что убивало смысл чтения на изучаемом языке. Свежая сверка с `contents/`: словарь/грамматика/истории структурно **одноязычные** (word/example_en/rule_en только в английском; `_ru`/`_tg` — это переводы/объяснения ДЛЯ рувоязычных/таджикоязычных студентов, а не отдельные курсы на этих языках). Поэтому в V2 решение: `locale` управляет **только вспомогательным текстом** (перевод слова, объяснение правила, текст вопроса на грамматику), но **никогда** не подменяет тело истории или её вопросы на понимание — они остаются на английском всегда (в моделях `Stories.body`/`StoryQuestions.text` вообще нет `_ru/_tg` вариантов, в отличие от `GrammarQuestions.text_en/ru/tg`, где локаль уместна — это тест на грамматику, а не чтение).

### 5.1. Модели словаря и грамматики
- `Backend/app/models/model_content.py` — `VocabEntries` (`word`, `part_of_speech`, `example_en`, `translation_ru`/`translation_tg`, `cefr_level`, `unit`), `GrammarLessons` (`cefr_level`, `unit`, `lesson`, `topic`, `rule_en/ru/tg`, `structure`, `tip`), `GrammarExamples` (`lesson_id`, `text`, `order`), `GrammarQuestions` (`lesson_id`, `type`, `text_en/ru/tg`, `options` JSON/JSONB, `answer`, `explanation_en/ru/tg`).
- Сверено с реальными файлами (`contents/Vocabluary/vocab_extract.json`, `contents/Elementary/Grammar/parts/en_1.json`): поля совпадают (`examples_en` — массив строк на урок → по одной `GrammarExamples` на строку с `order`=индекс).
- Проверено вживую: `Base.metadata.tables` видит все 4 таблицы.

### 5.2. Модели историй
- `Stories` (`title_en/ru/tg`, `body_en/ru/tg`, `cefr_level`, `genre`, `grammar_topic`, `image_url`, `is_system`), `StoryWords` (`story_id`, `word`, `translation_ru/tg`, `part_of_speech`, `context`), `StoryQuestions` (`story_id`, `text`, `options` JSON, `answer`).
- Сверено с реальным контентом (`contents/Elementary/Stories/parts/en_1.json` **и** `ru_1.json`): `ru_1.json` — это **полный параллельный перевод** тех же историй (тот же порядок, те же `book_unit`/`grammar_topic`), а не отдельная озвучка на другом языке. Это ровно та форма контента, что породила баг V1 — значит `body_ru`/`body_tg` в API **не должны** тихо подменять тело истории по `?locale=`. План решения (зафиксирован в шапке фазы 5): английские `title_en`/`body_en` — всегда основной текст для чтения; `_ru`/`_tg` версии выдаются только как отдельное, явно запрошенное поле-подсказка (перевод), реализация — в 5.4/5.8.
- Проверено вживую: `Base.metadata.tables` видит `stories`, `story_words`, `story_questions`.

### 5.3. Миграция контента
- `Backend/alembic/versions/5b55682f0883_create_content_tables.py` — все 7 таблиц разом.
- Проверено вживую: `upgrade head` / `downgrade -1` / `upgrade head` — чисто.

### 5.4. Схемы контента
- `Backend/app/services/localization.py` — `pick_locale(obj, field_prefix, locale)`: невалидная локаль → `en`; если `{prefix}_{locale}` пусто/`None` → фолбэк на `{prefix}_en`. Годится для `rule_*` (грамматика), `text_*`/`explanation_*` (вопросы по грамматике) — везде, где реально есть `_en`-вариант.
- Для `VocabEntries.translation_*` и `Stories.title_*/body_*` фолбэк через `pick_locale` **не подходит** (нет `translation_en`/у сторис перевод — не по правилу, а исключение из общего правила и должен явно НЕ подменять `body`) — там локаль выбирается прямой веткой в `crud_content.py` (следующие шаги), а не общим хелпером.
- `Backend/app/schemas/schema_content.py` — `VocabResponse`, `GrammarLessonResponse`(+`Detail` с `examples`/`questions`), `GrammarQuestionResponse`(+`Result` с `explanation`), `QuestionSubmit`/`GrammarSubmitResult`, `WeakTopicResponse`, `StoryResponse`(+`Detail`: `body` — всегда английский, `title_translated`/`body_translated` — отдельные поля для перевода, не подменяют основные), `StoryWordResponse`, `StoryQuestionsSubmit`/`Result`.
- Проверено вживую: `pick_locale` — реальное значение по локали, пустое значение по локали → фолбэк на `_en`, невалидная локаль → тоже `_en`; `VocabResponse` собирается.

### 5.5. Словарь: crud + роуты
- `Backend/app/services/crud_content.py` — `vocab_translation` (ru/tg → колонка, en → `None`, без общего `pick_locale`, см. заметку в 5.4), `vocab_to_response`, `get_vocab_entries` (фильтры `level`/`unit`/`search`, пагинация), `get_vocab_entry`.
- `Backend/app/api/router_content.py` — `router_vocabulary` (без авторизации — системный контент публичный на чтение, в отличие от личных сущностей типа колоды/профиля): `GET /vocabulary` (+`?locale=`), `GET /vocabulary/{id}`.
- Проверено вживую на двух реальных записях (`dog`/`cat`): фильтр `level=A1` вернул обе; `locale=ru` — `sobaka`/`kot`; `locale=tg` на одной записи — `saг`; `search=do` нашёл только `dog`; без локали (`en`) — `translation: null` (по дизайну — слово уже английское).

### 5.6. Грамматика: список и детали
- `crud_content.py` — `lesson_to_response`, `question_to_response`/`question_to_result_response` (через `pick_locale` — здесь он честно подходит, `text_en`/`explanation_en` реально существуют), `get_grammar_lessons` (фильтры level/unit), `get_grammar_lesson`, `get_lesson_examples`, `get_lesson_questions`, `get_lesson_detail` (правило + примеры + вопросы одним вызовом).
- `router_content.py` — `router_grammar`: `GET /grammar` (список), `GET /grammar/{id}?locale=` (деталь).
- Проверено вживую на реальном уроке (`rule_en` заполнен, `rule_tg` заполнен, `rule_ru` пуст): `locale=en` → английское правило; `locale=tg` → таджикское; `locale=ru` (пусто в БД) → фолбэк на английское — `pick_locale` отрабатывает все три ветки на реальных данных, не только в юнит-тесте.

### 5.7. Сдача упражнений и слабые темы
- `Backend/app/models/model_content.py` — `GrammarAttempts` (`user_id`, `question_id`, `is_correct`, `created_at`), миграция `alembic/versions/c59b7aee38a3_add_grammar_attempts_table.py`.
- `crud_content.py` — `submit_grammar_answers` (сравнение `answer` без учёта регистра/пробелов, пишет попытку на каждый вопрос, считает `correct`), `get_weak_topics` (агрегация в Python — join `GrammarAttempts→GrammarQuestions→GrammarLessons`, группировка по `topic`, `error_rate = incorrect/attempts*100`, сортировка по убыванию).
- `router_content.py` — `GET /grammar/weak-topics` объявлен **до** `GET /grammar/{lesson_id}` (иначе `weak-topics` пыталась бы распарситься как `int` и давала 422 вместо честного 200 — правило CONVENTIONS §7 про порядок роутов тут поймало бы реальный баг), `POST /grammar/{lesson_id}/submit`.
- Проверено вживую на сценарии с двумя темами: `verb be` (1 правильный/1 неправильный из 2) и `plurals` (0 из 1) → `weak-topics` вернул `[{'plurals', error_rate:100.0}, {'verb be', error_rate:50.0}]` — отсортировано по убыванию ошибок, как требует DoD.

### 5.8. Истории: список и детали
- `Backend/app/services/crud_story.py` (отдельно от `crud_content.py` — истории достаточно самостоятельный поддомен) — `story_to_response` (`title` = всегда `title_en`), `story_translation` (перевод `title`/`body` по локали, **без** фолбэка на en — это не `pick_locale`, а намеренно другая функция: см. заметку в шапке фазы 5), `get_stories` (фильтры level/genre), `get_story_detail` (тело + слова + вопросы одним вызовом).
- `Backend/app/schemas/schema_content.py` — `StoryWordResponse` пересмотрен: вместо одной локаль-зависимой `translation` — **обе** `translation_ru`/`translation_tg` сразу (DoD прямо требует «words с переводами ru/tg» — во множественном числе, это подсказки-глоссарий, а не locale-gated поле).
- `Backend/app/api/router_story.py` — `router_stories`: `GET /stories` (список), `GET /stories/{id}?locale=` (деталь).
- Проверено вживую на реальной истории (`title_en`/`body_en` + `title_ru`/`body_ru` заполнены, слово `nervous` с обоими переводами, один вопрос на понимание): **и** `locale=en`, **и** `locale=ru` отдают одно и то же `body` (английское) — перевод виден только в отдельном `body_translated`/`title_translated`. Это прямая проверка того, что баг V1 не воспроизведён.

### 5.9. Прогресс чтения
- `Backend/app/models/model_content.py` — `ReadingProgress` (`user_id`, `story_id`, `is_completed`, `last_position`, `updated_at` с `onupdate=func.now()`, `UniqueConstraint(user_id, story_id)`). Миграция `alembic/versions/ab2d193bd6e5_add_reading_progress_tracking.py`.
- `crud_story.py` — `upsert_reading_progress` (найти-или-создать + `is not None` на оба Boolean/Integer поля), `get_my_reading_progress`.
- `router_story.py` — `GET /stories/my-progress` объявлен **до** `GET /stories/{id}` (тот же порядок роутов, что и в 5.7), `POST /stories/{id}/progress`.
- Проверено вживую: первый `POST` создаёт запись (`is_completed=false`, `last_position=50`), второй `POST` **апсертит** ту же запись (`is_completed=true`, `last_position=100` — не дублирует строку благодаря уникальному индексу и поиску перед вставкой), `GET /stories/my-progress` отражает финальное состояние.

### 5.10. Слово из истории — в колоду
- `crud_card.create_card` получил необязательный `source_story_id=None` (без ломки существующих вызовов из `router_deck.py`).
- `crud_story.py` — `add_story_word_to_deck(word_id, user_id, locale, db)`: берёт `StoryWords`, переводом карточки становится `translation_tg` при `locale='tg'`, иначе `translation_ru`; зовёт `crud_card.create_card` напрямую (без дублирования проверки дубликата — она уже в `create_card`), контекст слова уходит в `example`.
- `router_story.py` — `POST /stories/{story_id}/words/{word_id}/add-to-deck`.
- Проверено вживую: слово `nervous` (с контекстом и обоими переводами) добавилось в колоду с `translation`/`example`/`source_story_id=3`; повторный вызов → 400 `CARD_ALREADY_EXISTS` (переиспользуется проверка из 4.5, не задвоена).

### 5.11. Вопросы на понимание
- `crud_story.py` — `submit_story_questions`: сравнение без регистра/пробелов, **прохождение = все ответы верны** (порог не был явно зафиксирован в плане — выбрал самый строгий и понятный вариант: "completed" только при 100%, а не произвольном проценте); при прохождении апсертит `ReadingProgress.is_completed=True`.
- `router_story.py` — `POST /stories/{id}/questions/submit`.
- Проверено вживую на реальной истории с двумя вопросами: 1 из 2 правильных → `completed:false`, и `my-progress` **пуст** (запись не создаётся зря); оба правильных → `completed:true`, `my-progress` показывает `is_completed:true`.

**Фаза 5 закрыта**: словарь/грамматика/истории с полноценной локализацией — и, что важнее всего, без повторения корневого архитектурного бага V1 (тело истории для чтения никогда не подменяется локалью, переводы — отдельные явные поля). Все 11 шагов проверены вживую на реальных данных через `uvicorn`.

## Фаза 6 — Социальные функции

### 6.1. Модель подписок
- `Backend/app/models/model_social.py` — `Follows` (`follower_id`, `following_id`, `UniqueConstraint` на пару, `CheckConstraint('follower_id != following_id')`).
- Миграция `alembic/versions/6ad60e167533_add_follow_model.py`.
- Проверено вживую на реальных пользователях (на уровне БД, не ORM-валидации): `Follows(follower=28, following=28)` → `IntegrityError` (`ck_follows_no_self_follow`); повторная пара `(28,29)` → `IntegrityError` (`uq_follows_pair`). Оба constraint'а реально защищают на уровне Postgres, а не только в Python-коде.

### 6.2. Схемы и crud подписок
- `Backend/app/schemas/schema_social.py` — `FollowUserResponse`.
- `Backend/app/services/crud_social.py` — `follow_user` (400 `CANNOT_FOLLOW_SELF`/`ALREADY_FOLLOWING` — уровень API дублирует DB constraints понятными кодами, а не отдаёт голый `IntegrityError`), `unfollow_user`, `get_followers`/`get_following` (join на `Users`), `get_friends` (пересечение по `id`), `is_mutual`.
- Проверено вживую на трёх пользователях (A/B/C): A↔B взаимно, A→C односторонне → `get_friends(A)` = `[B]` (не включает C); `is_mutual(A,B)=True`, `is_mutual(A,C)=False`; повторная подписка и подписка на себя правильно отклоняются кодами `ALREADY_FOLLOWING`/`CANNOT_FOLLOW_SELF`.

### 6.3. Роуты подписок
- `Backend/app/api/router_social.py` — `router_social` (`prefix='/social'`): `GET /followers`/`/following`/`/friends`, `POST/DELETE /follow/{user_id}`. `follow_user` роут дозагружает целевого `Users` через `crud_user.get_by_id`, чтобы отдать реальный `username`, а не пустышку.
- `schema_social.py` — `FollowUserResponse` получил `ConfigDict(from_attributes=True)` (нужен для сериализации ORM-объекта `Users`).
- Подключено в `main.py`.
- Проверено вживую на двух реальных пользователях (сценарий из DoD): A подписывается на B → 200 с данными B; B подписывается на A → 200 с данными A; `GET /social/friends` у обоих показывает друг друга; `DELETE /follow/{id}` отписывает, после чего `friends` снова пуст. Мелкий урок теста: перепутал порядок переменных при первой попытке (id первой печатается для A, но я расставил их наоборот) — не баг кода, ошибка в самом тестовом скрипте, переделал.

### 6.4. Счётчики в профиле
- `schema_profile.py` — `PublicProfileResponse` пополнен `followers_count`/`following_count`/`friends_count` (все Optional, гейтятся `show_followers`, как и остальные приватные поля).
- `crud_profile.py` — `get_public_profile` зовёт `crud_social.get_followers`/`get_following` напрямую (кросс-модульный вызов crud, как в 5.10) и считает `friends_count` пересечением, но только если `privacy.show_followers`.
- Проверено вживую на трёх пользователях (A↔B взаимно, C→A односторонне): публичный профиль A с `show_followers=True` → `followers_count=2, following_count=1, friends_count=1` (числа сходятся со схемой подписок); после `PATCH show_followers=false` — все три поля пропадают из ответа целиком (не `null`).

**Фаза 6 закрыта**: подписки, взаимные друзья, счётчики в профиле с уважением приватности — 4 шага, все проверены вживую на реальных пользователях и реальных HTTP-запросах.

## Фаза 7 — Ачивки и рейтинги

### 7.1. Модели ачивок
- `Backend/app/models/model_achievement.py` — `Achievements` (`code` unique, `title`, `description`, `category`, `threshold`, `icon`), `UserAchievements` (`user_id`, `achievement_id`, `earned_at`, `UniqueConstraint` на пару).
- Миграция `alembic/versions/ed880055ea02_add_achievement_models.py`.
- Проверено вживую на реальном пользователе: выдача ачивки прошла, повторная выдача той же пары → `IntegrityError` (`uq_user_achievements_pair`) — уникальность реально защищает на уровне Postgres.

### 7.2. Сид ачивок
- `Backend/seeds/seed_achievements.py` — 17 определений по категориям (`words_10/50/100/500` — grinder, `streak_7/30/100` — learner, `stories_written_1/5/20`/`stories_sold_1/10`/`reviews_received_10` — teacher, `friends_5/20` — social, `reviews_5/25` — grinder), идемпотентно (проверка по `code` перед вставкой), отчёт `created`/`skipped` в stdout.
- Проверено вживую: первый запуск — `created: 17, skipped: 0`; повторный — `created: 0, skipped: 17` — точно повторяет требование памяти [[glossa-achievements-seed]] про грабли старого проекта (без сида ачивки молча не находятся).

### 7.3. Стрики
- `model_achievement.py` — `UserStreaks` (`user_id` уникальный, `current_streak`, `best_streak`, `last_activity_date` — `Date`, не `DateTime`). Миграция `alembic/versions/f7571dd3c842_add_streak_tracking.py`.
- `Backend/app/services/streaks.py` — `touch_streak(user_id, db)`: сегодня уже был → no-op, вчера → `+1`, разрыв (включая `None`) → сброс в 1; `best_streak = max(best, current)`.
- Подключено в `review.submit_review` (4.7, через `card.user_id`) и `crud_story.submit_story_questions` (5.11, только при `completed=True`).
- Проверено вживую на реальном пользователе прямыми вызовами `touch_streak` с подставленными датами: сегодня дважды → `1,1` (no-op); дата вчера → `2,2`; дата 3 дня назад (разрыв) → `1` (best остался `2`) — все три ветки DoD подтверждены. Отдельно проверил реальный путь через `crud_card.create_card` + `review.submit_review` — стрик действительно трогается (`current_streak=1`), а не только в юнит-тесте функции.

### 7.4. Сервис проверки ачивок
- `Backend/app/services/achievements.py` — `get_metrics` (карточки `learned`, `reviews` через join `ReviewLogs→Cards`, `streak.current_streak`, `friends` через `crud_social.get_friends`); `stories_written`/`stories_sold`/`reviews_received` пока жёстко `0` — **честное ограничение**: пользовательские истории и их продажи/отзывы появятся только в фазе 10, до тех пор эти категории физически не могут сработать (не баг, а отсутствие данных — как и в 3.9/5.9).
- `check_achievements(user_id, db)`: метрика определяется по коду через `code.rsplit('_', 1)[0]` (`'words_10'→'words'`, `'reviews_received_10'→'reviews_received'`, `'reviews_5'→'reviews'` — разные ключи, коллизии префиксов нет), пропускает уже выданные, выдаёт новые одним batch-коммитом.
- Проверено вживую: пользователю с ровно 10 `learned`-карточками выдался **только** `words_10` (не `words_50`); повторный вызов `check_achievements` не выдал дубликат — соответствует DoD дословно.

### 7.5. Роуты ачивок
- `Backend/app/schemas/schema_achievement.py` — `AchievementResponse` (справочник, `from_attributes=True`) и `MyAchievementResponse` (заработанная ачивка с `earned_at`; без `from_attributes`, т.к. `get_my_achievements` отдаёт обычные dict'ы, а не ORM-объекты — тот же паттерн, что в публичном профиле и деталях истории).
- `achievements.py` пополнен двумя функциями: `get_all_achievements(db)` (весь справочник) и `get_my_achievements(user_id, db)` (join `Achievements`↔`UserAchievements`, только свои).
- `Backend/app/api/router_achievement.py` — `router_achievement` (`prefix='/achievements'`): `GET /achievements` (без авторизации — публичный справочник) и `GET /achievements/my` (через `get_current_user`). Подключено в `main.py`.
- Проверено вживую: создал тестового пользователя через Django shell, сгенерировал ему JWT напрямую через `RefreshToken.for_user` (без похода через логин-эндпоинт); `GET /achievements` отдал все 17 ачивок из сида; `GET /achievements/my` для свежего пользователя вернул `[]`; вручную выдал ачивку `words_10` — `GET /achievements/my` показал её с `earned_at`. Тестовые данные подчищены (сначала `UserAchievements`/`UserStreaks`, потом Django `User` — порядок из-за FK).

### 7.6. XP-транзакции
- `Backend/app/models/model_rating.py` — `XpTransactions` (`user_id`, `amount`, `reason` — Postgres ENUM `xp_reason` с 5 значениями: `review_passed/word_learned/story_written/review_received/social`, `created_at`). Миграция `alembic/versions/ba0596ab6059_add_xp_transactions.py`.
- Грабли: автосгенерированный `downgrade()` дропал таблицу, но не ENUM-тип — повторный `upgrade` после `downgrade` падал `DuplicateObjectError` (тип остаётся в Postgres, `CREATE TYPE` не может создать его снова). Починил явным `sa.Enum(name='xp_reason').drop(op.get_bind(), checkfirst=True)` в `downgrade()` — стандартная особенность alembic с Postgres ENUM, не автогенерируется сама.
- `Backend/app/services/ratings.py` — `XP_REWARDS` (таблица начислений: review_passed 10, word_learned 5, story_written 50, review_received 15, social 2), `award_xp(user_id, reason, db)`: читает `UserSettings.ratings_enabled` через `crud_settings.get_settings`, при `False` — no-op (возвращает `None`, ничего не пишет).
- Проверено вживую на реальном пользователе: `award_xp(42, 'review_passed', db)` с `ratings_enabled=True` (по умолчанию) → запись создана, `amount=10`; после `ratings_enabled=False` — `award_xp(42, 'word_learned', db)` вернул `None`, новых строк в `xp_transactions` не появилось — оба пункта DoD подтверждены. Также прогнал полный цикл `upgrade head → downgrade -1 → upgrade head` после починки — сработал чисто.

### 7.7. Врезка XP в доменные события
- `review.submit_review` — после `streaks.touch_streak` добавлен вызов `ratings.award_xp(card.user_id, 'review_passed', db)`, только при `quality >= 3` (плохое ревью XP не даёт).
- `crud_card.update_card_status` — XP `word_learned` начисляется **только на переходе** в `learned` (сравнение `card.status != 'learned'` до записи нового статуса, а не на каждый PATCH) — иначе повторные `PATCH .../status {"status":"learned"}` плодили бы бесконечный XP.
- `crud_content.submit_grammar_answers` — за каждый правильный ответ по отдельности вызывается `ratings.award_xp(user_id, 'review_passed', db)` (та же причина, что и для ревью карточек — "прохождение упражнения"; отдельного reason под грамматику в 7.6 не заводилось, XP_REWARDS общий).
- Проверено вживую сквозным сценарием на реальном пользователе: создал карточку → `POST /reviews/{id}` с `quality=4` → в `xp_transactions` появилась `review_passed/10`; `PATCH /deck/{id}/status {"status":"learned"}` → появилась `word_learned/5`; повторный точно такой же PATCH → новых строк не добавилось (защита от дублирования сработала); временно вставил тестовый `GrammarLessons`+2 `GrammarQuestions` напрямую в БД (реального контента ещё нет — фаза 15) и вызвал `POST /grammar/{id}/submit` с 1 верным и 1 неверным ответом → добавилась ровно одна `review_passed/10` (не две) — начисление именно за верные ответы. Все временные данные (карточка, review_logs, xp_transactions, user_streaks, тестовый урок/вопросы, Django-пользователь) подчищены в правильном FK-порядке.

**Фаза 7 закрыта**: ачивки, стрики, XP и лидерборды — источник правды в Postgres (`XpTransactions`), Redis только производное.

### 7.8. Лидерборды
- `Backend/app/services/ratings.py` пополнен: `LEADERBOARD_GLOBAL_KEY`, `weekly_leaderboard_key()` (ISO-неделя, формат `leaderboard:week:{year}-W{week:02d}`), `award_xp` теперь помимо записи в БД делает `ZINCRBY` в оба ключа сразу; `get_leaderboard(key, db, limit)` (ZREVRANGE + подгрузка `username` пачкой через новый `crud_user.get_by_ids`); `get_my_rank(user_id, key)` (ZREVRANK + ZSCORE); `remove_from_leaderboards(user_id)` (ZREM из обоих ключей); `rebuild_from_db(db)` (пересчёт global из суммы `XpTransactions` по пользователю, пропускает тех, у кого `ratings_enabled=False` — сама Celery-задача на пересборку будет в фазе 11, здесь только функция).
- `crud_settings.update_settings` — при переходе `ratings_enabled: True→False` (сравнение до изменения поля) вызывает `ratings.remove_from_leaderboards` (ленивый импорт внутри функции, чтобы не ловить циклический импорт `ratings↔crud_settings`, т.к. `ratings.py` сам импортирует `crud_settings` на верхнем уровне).
- `Backend/app/schemas/schema_rating.py` — `LeaderboardEntry` (rank/user_id/username/score), `MyRankResponse` (rank nullable/score).
- `Backend/app/api/router_rating.py` — `router_rating` (`prefix='/leaderboard'`): `GET /global`, `/weekly`, `/me`; общий `require_ratings_enabled` дергается в начале каждого роута — при `ratings_enabled=False` у самого вызывающего отдаёт 403 `RATINGS_DISABLED` с текстом из ТЗ дословно. Подключено в `main.py`.
- Грабли: docker-контейнеры (postgres/redis/django_app/minio) не были подняты в начале сессии — `/leaderboard/*` падал `ConnectionError` на `localhost:6379`; поднял `docker compose up -d redis` отдельно, `redis-cli ping` → `PONG`, дальше всё заработало. Второй грабель: тестовый PATCH настроек бил в `/settings/` (без слеша `/me`) → 404; актуальный путь `/settings/me`.
- Проверено вживую на двух реальных пользователях: у пользователя A `/leaderboard/global` и `/me` до начисления XP — пустой список / `rank:null,score:0`; после `POST /reviews/{id}` с `quality=4` — оба списка показывают `{rank:1,user_id,username,score:10}`, `/me` → `{rank:1,score:10}`; `PATCH /settings/me {"ratings_enabled":false}` → сам A получает 403 на все три эндпоинта листинга; проверено с точки зрения **другого** пользователя B (не просто самим A) — `GET /leaderboard/global` от лица B возвращает `[]`, A реально исчез из списка, а не просто не видит сам себя. Все тестовые данные (карточка, review_logs, xp_transactions, user_settings, user_streaks, redis-записи в обоих ключах, два Django-пользователя) подчищены.

## Фаза 8 — Подписки и лимиты

### 8.1. Модели тарифов
- `Backend/app/models/model_subscription.py` — `Plans` (`code` unique, `price_monthly`/`price_yearly` — `Numeric(10,2)`, лимиты `stories_per_day`/`deck_words_per_day`/`own_stories_per_week`/`ai_seconds_per_day` — все `int | None` (`None` = безлимит, как в ТЗ), `can_buy_stories`/`telegram_access` — bool), `UserSubscriptions` (`user_id`, `plan_id`, `period`, `started_at`, `expires_at`, `is_active`).
- Миграция `alembic/versions/1146123d2820_add_subscription_plan_models.py` — на этот раз без ENUM-типов, поэтому грабли из 7.6 (недропнутый тип при downgrade) здесь не актуальны; цикл `upgrade → downgrade -1 → upgrade` прогнан и прошёл чисто с первого раза.
- Проверено вживую: таблицы `plans`/`user_subscriptions` реально созданы, FK на `plans.id`/`users.id` встали, `code` уникален на уровне индекса.

### 8.2. Сид тарифов
- `Backend/seeds/seed_plans.py` — три плана по таблице из промпта (2.5): `free` (0/0 сомони, 5 историй/день, 35 слов/день, 3 своих истории/нед, ai 0 сек, без покупки платных историй и телеграма); `premium` (250 мес / 2760 год — год посчитан как заявленные в промпте "230/мес." × 12, т.к. `price_yearly` в модели хранит полную годовую сумму, а не месячный эквивалент; безлимит историй и слов, 12 своих историй/нед, ai 9000 сек = 2.5 ч, покупка и телеграм разрешены); `pro` (500 мес / 5460 год = 455×12, 50 своих историй/нед, ai безлимит, покупка и телеграм разрешены). Идемпотентно через проверку по `code`, как в `seed_achievements`.
- Проверено вживую: первый запуск — `created: 3, skipped: 0`; повторный — `created: 0, skipped: 3`; прямым запросом к БД сверил все значения по каждому плану — совпадают с таблицей из промпта дословно (включая `None` = безлимит для `stories_per_day`/`deck_words_per_day` у premium/pro и `ai_seconds_per_day=None` у pro).

### 8.3. Мой тариф
- `Backend/app/services/crud_subscription.py` — `get_plans`, `get_plan_by_code`, `get_active_subscription(user_id, db)`: ищет активную неистёкшую `UserSubscriptions` (`is_active` и `expires_at > now`); если её нет — считается `free` (тот же паттерн "нет записи = дефолт", что и в `crud_settings`/`streaks`, только без автосоздания строки в БД — free ничего не создаёт, просто возвращает план).
- `Backend/app/schemas/schema_subscription.py` — `PlanResponse` (`from_attributes=True`, все лимиты `int | None`), `MySubscriptionResponse` (`plan` вложенный, `period`/`expires_at` nullable — при free оба `None`).
- `Backend/app/api/router_subscription.py` — `router_subscription` (`prefix='/subscriptions'`): `GET /plans` (без авторизации), `GET /my` (через `get_current_user`). Подключено в `main.py`.
- Проверено вживую: свежий пользователь → `/subscriptions/my` отдал `free` с `period:null, expires_at:null`; вручную вставил активную `UserSubscriptions` на `premium` (`expires_at` +30 дней) → `/subscriptions/my` сразу же показал `premium` со всеми его лимитами (`stories_per_day:null` = безлимит, `ai_seconds_per_day:9000`) и реальным `expires_at`; `/subscriptions/plans` без токена отдал все 3 плана. Тестовые данные (подписка, Django-пользователь) подчищены.

### 8.4. Счётчики лимитов в Redis
- `Backend/app/core/limits.py` — `incr_daily`/`get_daily` (ключ `limit:daily:{name}:{user_id}:{date}`, TTL выставляется только при первом `INCR` результата `1`, до полуночи UTC), `incr_weekly`/`get_weekly` (ключ по ISO-неделе `limit:weekly:{name}:{user_id}:{year}-W{week}`, TTL до следующего понедельника 00:00 UTC); `check_limit(user_id, name, db)` — тянет активную подписку через `crud_subscription.get_active_subscription` (ленивый импорт, та же причина цикла, что в 7.8), `limit=None` → безлимит (`True` без похода в Redis), иначе сверяет текущий счётчик (`DAILY_LIMIT_FIELDS`/`WEEKLY_LIMIT_FIELDS` — какие поля плана суточные, какие недельные) с порогом.
- Проверено вживую: `incr_daily` три раза подряд → `1,2,3`, `get_daily` вернул `3`, TTL ключа ≈ 37064 сек (совпадает с реальным временем до полуночи UTC на момент теста); `incr_weekly` → TTL ≈ 382664 сек (в пределах недели, до понедельника); на реальном пользователе с планом `free` (`stories_per_day=5`) вызвал `check_limit` перед каждым из 5 инкрементов — все 5 раз `True`, после 5-го `incr_daily` — `check_limit` вернул `False` (лимит именно 5, не 4 и не 6). Тестовые данные (redis-ключи, Django-пользователь) подчищены.

### 8.5. Enforcement лимитов
- `Backend/app/core/limits.py` пополнен тремя FastAPI-зависимостями: `enforce_story_limit`, `enforce_deck_word_limit` (обе проверяют `check_limit` на нужное суточное поле, при `False` — `AppError('LIMIT_REACHED', 'Daily limit reached, upgrade your plan', 403)` — текст ошибки дословно из ТЗ; при успехе инкрементят счётчик и возвращают `current_user`, поэтому в роуте зависимость **заменяет** обычный `get_current_user`, а не добавляется вторым параметром), `enforce_own_story_limit` (та же схема, но по недельному полю `own_stories_per_week` — создана заранее по плану, но подключать пока некуда: авторские истории появятся только в фазе 10).
- `router_story.get_story` (`GET /stories/{story_id}`) — был полностью публичным (без авторизации вообще); теперь требует авторизации через `enforce_story_limit`, т.к. лимит "историй в день" физически не может считаться без привязки к пользователю. Это осознанное изменение поведения эндпоинта, продиктованное самим ТЗ (2.5), а не побочный эффект.
- `router_story.add_story_word_to_deck` и `router_deck.create_card` — `current_user=Depends(get_current_user)` заменён на `current_user=Depends(enforce_deck_word_limit)` (единая точка создания карточки что из колоды, что из истории — оба пути одинаково расходуют суточный лимit слов).
- Упрощение (осознанное, не баг): `enforce_story_limit` считает каждое открытие эндпоинта, а не уникальные `story_id` за день — как и лимит слов в колоду (там дубликаты и так отсекаются на уровне `CARD_ALREADY_EXISTS`, а для историй отдельного дедупликатора по ТЗ не требовалось), это соответствует буквальной формулировке DoD (подсчёт 36-й карточки/6-й истории, без выделения "уникальности").
- Проверено вживую на реальном free-пользователе: временно вставил тестовую `Stories` (нет ещё реального контента — фаза 15); 5 подряд `GET /stories/{id}` → `200`, 6-й → `403 LIMIT_REACHED` с точным текстом ошибки из ТЗ; 35 подряд `POST /deck/` → все `200`, 36-й → `403`; после этого вручную выдал тому же пользователю активную `premium`-подписку (`can_buy_stories`/лимиты безлимитны) — тот же самый 6-й `GET /stories/{id}` и 37-й `POST /deck/` (те самые запросы, что раньше падали) теперь оба вернули `200` — премиум реально снимает лимит, а не просто увеличивает порог. Все тестовые данные (карточки, тестовая история, подписка, redis-счётчики, Django-пользователь) подчищены.

### 8.6. Гейт доступа к ИИ
- `Backend/app/core/limits.py` пополнен: `ai_seconds_key(user_id)` (`ai:seconds:{user_id}:{date}`), `get_ai_seconds_used`, `add_ai_seconds(user_id, seconds)` (`INCRBY`, TTL до полуночи выставляется только когда результат равен только что добавленному значению — то есть это был первый инкремент за день); `require_ai_access` — зависимость: `ai_seconds_per_day == 0` (free) → `AppError('AI_ACCESS_DENIED', 'AI chat is available for premium plans', 403)` дословно из ТЗ; `ai_seconds_per_day is None` (pro) → всегда пропускает; иначе (premium с конкретным лимитом) сверяет `get_ai_seconds_used` с лимитом, при исчерпании → `AppError('AI_LIMIT_REACHED', 'Daily AI time limit reached, upgrade your plan', 403)` (текст этого конкретного сообщения в ТЗ не задан дословно — сформулировал по аналогии с 8.5).
- Пока никуда не подключено намеренно — реальный ИИ-чат появится в фазе 13, само учётное поведение (списание секунд по мере использования) тоже подключится тогда; сейчас только зависимость + функции учёта готовы заранее, как явно указано в плане.
- Проверено вживую (без реального роута, прямым вызовом `require_ai_access` с фейковым `current_user`, т.к. подключать пока некуда): free-пользователь → `AI_ACCESS_DENIED`; тот же пользователь, повышенный до `premium` (`ai_seconds_per_day=9000`), с `used=8999` → `ALLOWED`, после `add_ai_seconds(+1)` → `used=9000` → `AI_LIMIT_REACHED` (граница ровно на пороге, не на 8999 и не на 9001); тот же пользователь, переключённый на `pro` (`ai_seconds_per_day=None`), с теми же `9000` уже потраченных секунд → `ALLOWED` — безлимит игнорирует накопленный счётчик. Тестовые данные (подписка, redis-ключ, Django-пользователь) подчищены.

**Фаза 8 закрыта**: тарифы, лимиты в Redis, enforcement на уровне зависимостей, гейт ИИ — всё по таблице из промпта (2.5), протестировано на реальных HTTP-запросах и реальных подписках.

## Фаза 9 — Wallet, Stripe, покупки

### 9.1. Модель баланса
- `Backend/app/models/model_payment.py` — `UserBalances` (`user_id` unique, `balance` — `Numeric(10,2)` default `0`, `created_at`/`updated_at` с `onupdate=func.now()` — единственная модель в проекте, где понадобился `onupdate`, т.к. баланс меняется многократно после создания записи, в отличие от, например, `Cards`, где обновления идут через явные поля без отдельного `updated_at`).
- Миграция `alembic/versions/cbc6941af241_add_user_balance_model.py` — без ENUM, цикл `upgrade → downgrade -1 → upgrade` прошёл чисто с первого раза.
- Проверено вживую: таблица `user_balances` создана, `user_id` уникален на уровне индекса, `balance` — Decimal с 2 знаками после запятой.

### 9.2. CRUD баланса
- `Backend/app/services/crud_payment.py` — `get_or_create_balance(user_id, db)` (автосоздание записи с `balance=0` при первом обращении, тот же паттерн, что в `crud_settings`/`streaks`), `topup_balance(user_id, amount, db)` (`amount <= 0` → `AppError('INVALID_AMOUNT', 'Amount must be positive', 400)`, иначе прибавляет к текущему балансу).
- `Backend/app/schemas/schema_payment.py` — `BalanceResponse` (`Decimal`, `from_attributes=True`), `TopupRequest` (`amount: Decimal`).
- Проверено вживую на реальном пользователе: первый `get_or_create_balance` → `0.00`, второй вызов сразу следом → тоже `0.00` и прямым `COUNT` по таблице подтвердил, что строка ровно одна (не задвоилась); `topup_balance(100)` → `100.00`; `topup_balance(-5)` → `AppError INVALID_AMOUNT` — оба пункта DoD подтверждены. Тестовые данные подчищены.

### 9.3. Эндпоинты баланса
- `Backend/app/api/router_payment.py` — `router_payment` (`prefix='/balance'`): `GET /balance` (авто-создание при первом обращении через `get_or_create_balance`), `POST /balance/topup` (тестовое пополнение — реальная оплата придёт через Stripe в 9.4-9.6). Подключено в `main.py`.
- Проверено вживую на реальном пользователе: `GET /balance` → `{"balance":"0.00"}`; `POST /balance/topup {"amount":100}` → `{"balance":"100.00"}` — ровно 100.00, как того требует DoD; `POST /balance/topup {"amount":-5}` → `400`. Тестовые данные подчищены.

### 9.4. Конфиг Stripe
- `Backend/app/core/config.py` — `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (пустая строка по умолчанию, а не `None` — чтобы `if not settings.STRIPE_SECRET_KEY` работало без доп. проверки на `None`), `STRIPE_SUCCESS_URL`/`STRIPE_CANCEL_URL` (дефолт на фронтовые `/payment/success`/`/payment/cancel`).
- `.env.example` пополнен теми же 4 переменными; `requirements.txt` — добавлен `stripe==15.3.1` (и его собственные новые транзитивные зависимости `certifi`/`charset-normalizer`/`requests`, которых раньше в проекте не было — до этого никто не делал реальных HTTP-запросов наружу).
- DoD этого шага ("пустые ключи → stripe-роуты отвечают 400") **физически не может быть проверен прямо сейчас** — самих stripe-роутов ещё нет, они появятся в 9.5/9.6. Это отложенная проверка, аналогично 8.6 (зависимость создана, подключение и тест — позже); реально протестирую это как часть DoD шага 9.5.
- Проверено вживую: `settings.STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` при пустом `.env` → `''` (не падает, не `None`), URL'ы — дефолтные значения подставились.

### 9.5. Checkout session
- `Backend/app/services/stripe_service.py` — `require_stripe_configured()` (пустой `STRIPE_SECRET_KEY` → `AppError('STRIPE_NOT_CONFIGURED', 'Stripe is not configured', 400)`, дословно текст из ТЗ; иначе выставляет `stripe.api_key`), `create_checkout_session(user_id, amount, currency='usd')` — `stripe.checkout.Session.create(mode='payment', ...)` с `metadata={'user_id': str(user_id)}`, `unit_amount` в центах, success/cancel URL из конфига.
- `Backend/app/schemas/schema_payment.py` — `CheckoutSessionRequest`/`CheckoutSessionResponse`.
- `Backend/app/api/router_payment.py` — добавлен второй роутер в том же файле, `router_stripe` (`prefix='/stripe'`): `POST /stripe/create-checkout-session`. Подключено в `main.py`.
- Подход к оплате — тот же, что уже проверен и работает в проекте Bon Appetit (Stripe redirect + success/cancel страницы), по прямому указанию пользователя переиспользовать эту же схему здесь, а не изобретать новую.
- Ограничение (прозрачно зафиксировано, не скрыто): в этом проекте нет реальных Stripe test-ключей — я явно спросил пользователя, добавлять ли их, и получил ответ "делай как в Bon-Appetit, пока" — то есть строить по той же схеме, не блокируясь на живых ключах прямо сейчас. Поэтому вживую проверена только ветка "ключи не настроены" (она же закрывает отложенный DoD шага 9.4): `POST /stripe/create-checkout-session` при пустом `STRIPE_SECRET_KEY` → `400 STRIPE_NOT_CONFIGURED "Stripe is not configured"` — текст ошибки дословно совпадает с ТЗ. Ветка "валидный checkout url с реальными тестовыми ключами" не проверена вживую — потребует реальных Stripe test-ключей в `.env`, когда они появятся.

### 9.6. Stripe webhook
- `stripe_service.construct_webhook_event(payload, signature)` — `stripe.Webhook.construct_event` по подписи; невалидная подпись/пустой `STRIPE_WEBHOOK_SECRET` → `AppError('INVALID_STRIPE_SIGNATURE', ...)` / `STRIPE_NOT_CONFIGURED`, обе 400.
- `router_payment.stripe_webhook` (`POST /stripe/webhook`) — читает сырое тело запроса (`await request.body()`, не Pydantic-модель — подпись считается по байтам as-is), заголовок `Stripe-Signature`; при `checkout.session.completed` достаёт `metadata.user_id` и `amount_total` (в центах) из события, зовёт `crud_payment.topup_balance(user_id, amount_total/100, db)` — автосоздание баланса уже встроено в `topup_balance` через `get_or_create_balance`.
- Важная деталь: проверка подписи (`stripe.Webhook.construct_event`) — это чистый локальный HMAC-SHA256, не сетевой вызов к Stripe. Это позволило по-настоящему прогнать оба ветки DoD **без обращения к реальному Stripe API** — достаточно временного тестового `STRIPE_WEBHOOK_SECRET`, который никуда не сохранён (передан только как переменная окружения на время одного тестового запуска сервера, не в `.env`).
- Проверено вживую по-настоящему сквозным HTTP-запросом (не юнит-тестом функции): собрал корректный Stripe event JSON (с обязательными полями `id`/`object:'event'`/`api_version`/`created`, без которых сама библиотека `stripe` падает при парсинге — не хватало на первой попытке) и подписал его вручную тем же HMAC-алгоритмом, что использует Stripe (`t={timestamp},v1={hex_hmac}`); `POST /stripe/webhook` с валидной подписью и `amount_total=15000` → `200 {"status":"ok"}`, и `GET /balance` для того же пользователя сразу же показал `150.00` — списание сошлось с точностью до цента; тот же запрос с заведомо неверной подписью (`v1=deadbeefbadsignature`) → `400 INVALID_STRIPE_SIGNATURE`. Оба пункта DoD подтверждены реальным round-trip через работающий сервер. Тестовые данные (баланс, Django-пользователь, временные файлы payload/header) подчищены; сервер перезапущен без тестовых ключей.

**Фаза 9 продолжается**: баланс, депозит через тестовый topup и полноценный Stripe checkout+webhook готовы и подтверждены (насколько это в принципе возможно без реальных ключей — сам HMAC-протокол подписи проверен по-настоящему). Дальше — транзакционный сервис покупок (9.7) и подписка с баланса (9.8).

### 9.7. Транзакционный сервис покупки
- `Backend/app/models/model_payment.py` пополнен `Purchases` (`buyer_id`, `item_type`, `item_id` nullable, `amount`, `seller_id` nullable, `seller_income` nullable, `created_at`). Миграция `alembic/versions/99c151ebb66d_add_transactional_purchase_service.py`, цикл `upgrade → downgrade -1 → upgrade` чист.
- `Backend/app/services/purchase_service.py` — `purchase(buyer_id, total_price, item_type, db, item_id=None, seller_id=None, seller_share=None, create_entity=None)`: блокирует баланс покупателя `SELECT ... FOR UPDATE` (`_get_locked_balance`, с автосозданием при отсутствии), `balance < total_price` → `AppError('INSUFFICIENT_FUNDS', 'Insufficient balance', 400)`; списывает, при наличии `seller_id`+`seller_share` — блокирует и пополняет баланс продавца на `total_price * seller_share`; создаёт запись `Purchases`; вызывает `create_entity(db)` (коллбэк для доменной сущности — доступ к истории/подписка, появится при реальном использовании в 9.8/фазе 10); один `commit` в конце. Всё обёрнуто в `try/except Exception: await db.rollback(); raise` — при любом сбое (включая исключение из `create_entity`) откатывает и списание, и начисление, и саму запись `Purchases`, затем пробрасывает исходную ошибку дальше.
- Проверено вживую на реальных buyer/seller пользователях: (1) покупка на пустой баланс → `AppError INSUFFICIENT_FUNDS`, баланс покупателя остался `0.00`; (2) пополнил покупателя на `100`, купил за `50` с `seller_share=0.7` → баланс покупателя `50.00`, баланс продавца `35.00` (ровно 70% от 50), запись `Purchases` создана с `amount=50, seller_income=35`; (3) искусственно сломал `create_entity` (raise `RuntimeError`) на повторной покупке за `20` — после отката баланс покупателя и продавца остались **прежними** (`50.00`/`35.00`, не изменились), и прямым `COUNT` по `Purchases` подтвердил, что новой строки не появилось (осталась 1, а не 2) — рассинхрон «списали, но не создали» реально исключён транзакцией. Оба пункта DoD подтверждены. Тестовые данные подчищены.

### 9.8. Покупка подписки с баланса
- `crud_subscription.subscribe_to_plan(user_id, plan_code, period, db)` — цена берётся из `Plans` по `period` (`price_monthly`/`price_yearly`), длительность `30`/`365` дней; `create_entity`-коллбэк деактивирует **все** текущие активные `UserSubscriptions` пользователя (`UPDATE ... SET is_active=False`) и создаёт новую — единая операция закрывает и продление того же плана, и апгрейд/даунгрейд на другой, без отдельной ветки логики; вызывается через `purchase_service.purchase(..., item_type='subscription', item_id=plan.id, create_entity=...)` **без продавца** (`seller_id`/`seller_share` не переданы) — подписки не имеют получателя дохода, в отличие от будущих платных историй в фазе 10.
- `schema_subscription.py` — `SubscribeRequest` (`plan_code`, `period: Literal['monthly','yearly']`).
- `router_subscription.py` — `POST /subscriptions/subscribe`.
- Проверено вживую на реальном пользователе: (1) `POST /subscribe {"premium","monthly"}` с балансом `0` → `400 INSUFFICIENT_FUNDS` (сработала защита из общего `purchase_service`, отдельно код подписок её не дублирует); (2) пополнил до `300`, купил `premium` → баланс стал ровно `50.00` (списано `250.00`, как того требует DoD), ответ показал активный `premium` с полными лимитами и реальным `expires_at`; (3) прямым вызовом `check_limit` на том же пользователе после покупки (без перезапуска сервера/сессии) — оба лимита (`stories_per_day`, `deck_words_per_day`) уже безлимитны сразу после 40 накопленных инкрементов каждый — "лимиты сразу расширяются" подтверждено без каких-либо задержек или кэш-инвалидаций. Все три пункта DoD подтверждены. Тестовые данные (баланс, подписка, покупка, redis-счётчики, Django-пользователь) подчищены.

**Фаза 9 продолжается**: полный цикл кошелька — баланс, Stripe checkout+webhook, транзакционные покупки, оплата подписки с баланса — готов и проверен на реальных данных. Дальше — история платежей (9.9) и, судя по дальнейшим номерам плана, ещё несколько шагов до конца фазы.

### 9.9. История платежей
- `crud_payment.topup_balance` пополнен: теперь помимо изменения `balance` создаёт запись `Purchases(item_type='topup', seller_id=None, seller_income=None)` — переиспользование уже существующей таблицы `Purchases` вместо отдельной модели под пополнения (в плане для 9.9 новой модели/миграции не заявлено, только `crud.py`/`routes.py`), топ-апы и покупки естественным образом оказываются в одной хронологии по `item_type`.
- `crud_payment.get_payment_history(user_id, db, limit, offset)` — `Purchases` по `buyer_id`, сортировка `created_at DESC`, пагинация.
- `schema_payment.py` — `PaymentHistoryEntry`.
- `router_payment.py` — третий роутер в том же файле, `router_payments_history` (`prefix='/payments'`): `GET /payments/history`. Подключено в `main.py`.
- Проверено вживую на реальном пользователе: `topup(300)` → `POST /subscriptions/subscribe premium` (спишет `250`) → `GET /payments/history` вернул 2 записи в правильном порядке (сначала подписка, затем топ-ап — сортировка по убыванию времени верна): `{item_type:'subscription', item_id:2, amount:250.00}` и `{item_type:'topup', item_id:null, amount:300.00}` — история отражает и пополнения, и покупки в хронологии, как того требует DoD. Тестовые данные подчищены.

**Фаза 9 закрыта**: кошелёк, Stripe (checkout + webhook, подпись проверена по-настоящему через локальный HMAC без реального Stripe API), транзакционный сервис покупок с гарантией «списали и создали одновременно, либо ничего», оплата подписки балансом, история платежей — все шаги проверены на реальных HTTP-запросах и реальных данных.

## Фаза 10 — Пользовательские истории и упражнения

### 10.1. Модели пользовательских историй
- `Backend/app/models/model_user_story.py` — новый файл (не `model_content.py`, где живут **системные** `Stories` — у UGC-историй принципиально другая природа: автор, цена, статус модерации): `UserStories` (`author_id`, `title`, `body`, `description` nullable, `cefr_level`, `genre`, `price` nullable — `null`=бесплатная, `image_url`, `status` default `'draft'`, `views_count` default `0`), `StoryPurchases` (`story_id`, `buyer_id`, `UniqueConstraint` на пару).
- Миграция `alembic/versions/67c51516ffa5_add_user_story_models.py` — без ENUM, цикл `upgrade → downgrade -1 → upgrade` прошёл чисто.
- Проверено вживую: создал реальную `UserStories`, затем `StoryPurchases` на пару `(story_id, buyer_id)` — первая вставка прошла, повторная **та же пара** → `IntegrityError` на уровне Postgres (`uq_story_purchases_pair` реально защищает от задвоения покупки, не только на уровне будущей бизнес-логики). Тестовые данные подчищены.

### 10.2. Модели упражнений к историям
- `Backend/app/models/model_user_story.py` пополнен: `StoryExercises` (`story_id`, `type` — vocab/grammar/comprehension/custom, `question`, `options` JSON/JSONB — тот же паттерн, что в `GrammarQuestions`, `answer`, `explanation` nullable), `StoryExerciseAttempts` (`user_id`, `exercise_id`, `is_correct`, `created_at`).
- Миграция `alembic/versions/0347c6bf9b67_add_story_exercise_models.py`, цикл `upgrade → downgrade -1 → upgrade` чист.
- Проверено вживую: создал реальную `UserStories` → `StoryExercises` с `story_id` этой истории → `StoryExerciseAttempts` с `user_id` реального пользователя — оба FK встали, упражнение привязано к истории, попытка — к пользователю, ровно как того требует DoD. Тестовые данные подчищены.

### 10.3. Схемы UGC
- `Backend/app/schemas/schema_user_story.py` — `UserStoryCreate`/`UserStoryUpdate` (все поля апдейта опциональны), `UserStoryResponse` (каталожный вид без `body`), `UserStoryDetailResponse` — ключевая схема: `body`/`exercises` со значением по умолчанию `None`, чтобы при `response_model_exclude_none=True` (тот же паттерн, что в 3.9/5.x) отсутствие ключа в словаре из crud превращалось в физическое отсутствие поля в JSON, а не `null`; `ExerciseCreate`/`ExerciseResponse`/`ExerciseSubmit` (список `exercise_id`+`answer`), `ReviewCreate`/`ReviewResponse` (`rating` через `Field(ge=1, le=5)`), `AuthorStats` (заготовка под 10.10).
- Роутов/crud для UGC-историй пока нет (появятся в 10.5/10.6) — DoD этого шага ("платная история без покупки сериализуется без body") проверил напрямую на уровне схемы, не дожидаясь роута: собрал витринный dict без ключа `body`/`exercises`, провалидировал через `UserStoryDetailResponse`, вызвал `model_dump(exclude_none=True)` — в результате `'body' in dumped` и `'exercises' in dumped` оба `False`, при этом `title`/`description`/`price`/`author_id` и остальные каталожные поля присутствуют. Тот же принцип будет применён в реальном HTTP-ответе в 10.6, когда появится сам роут.

### 10.4. Гейт B2+
- `Backend/app/api/permissions.py` пополнен: `CEFR_ORDER` (`A1..C2`), `require_writer_level` — читает `UserLanguages` по `user_id` + `is_target=True` (уровень **целевого** языка, не любого из изучаемых), при отсутствии строки — дефолт `'A1'` (тот же "нет записи = самое строгое дефолтное значение", что уже применялось в других местах проекта); `CEFR_ORDER.index(level) < CEFR_ORDER.index('B2')` → `AppError('WRITER_LEVEL_REQUIRED', 'Writing stories requires Upper-Intermediate level', 403)` — текст дословно из ТЗ. Файл оставлен в уже существующем `app/api/permissions.py` (не заводил новый `app/core/permissions.py`, как буквально написано в плане — в проекте уже есть один файл под пермишены, `require_roles` живёт там же).
- Проверено вживую на реальном пользователе тремя вариантами: (1) вообще без `UserLanguages` → заблокирован (дефолт A1); (2) целевой язык на `A2` → заблокирован; (3) тот же пользователь, уровень поднят до `B2` → пропущен. Ровно то, что требует DoD (A2 → 403, B2 → проходит), плюс дополнительно проверил крайний случай отсутствия записи. Тестовые данные подчищены.

### 10.5. CRUD и создание историй с недельным лимитом
- `Backend/app/services/crud_user_story.py` — `create_user_story`/`update_user_story`/`delete_user_story`/`publish_user_story`: везде одна и та же проверка `price is not None and not description` → `AppError('PAID_STORY_NEEDS_DESCRIPTION', 'Paid stories must have a description', 400)` — не только при создании, но и при апдейте/публикации (нельзя обойти проверку, убрав описание после создания бесплатной и сделав её платной через PATCH). `update_user_story` использует уже привычный паттерн `data.field or obj.field`, `owner_id` сверяется явно (чужую историю не отдаёт — `None`, роут превращает в 404).
- `Backend/app/api/router_user_story.py` — `router_user_story` (`prefix='/user-stories'`): `POST ''` (`require_writer_level` **и** `enforce_own_story_limit` как два последовательных `Depends` — оба используют закэшированный FastAPI `get_current_user` под капотом, поэтому пользователь резолвится один раз, а не дважды), `PATCH/{id}`, `DELETE/{id}`, `POST /{id}/publish`, `POST /{id}/cover` (загрузка обложки в существующий MinIO-бакет `story-images`, созданный ещё в Фазе 1). Подключено в `main.py`.
- Мелкий баг найден и исправлен по ходу: сообщение `enforce_own_story_limit` (заведено в 8.5 по аналогии с daily-лимитами) буквально говорило `"Daily limit reached"` для **недельного** лимита — переиспользовал текст не подумав про контекст. Поправил на `"Weekly limit reached, upgrade your plan"` до коммита, не как отдельный баг-фикс потом.
- Проверено вживую на реальном B2-пользователе (уровень выставлен вручную через `UserLanguages`, т.к. это первый реальный сквозной вызов `require_writer_level` через HTTP): 3 истории подряд → `200`, 4-я → `403 LIMIT_REACHED "Weekly limit reached, upgrade your plan"` — ровно то, что требует DoD; отдельно на **свежем** пользователе (чтобы не упереться в тот же недельный лимит) — платная история без `description` → `400 PAID_STORY_NEEDS_DESCRIPTION`. Оба пункта DoD подтверждены независимо друг от друга. Тестовые данные (истории, `UserLanguages`, redis-счётчик, Django-пользователи) подчищены.

### 10.6. Каталог и деталка UGC
- `crud_user_story.py` пополнен: `get_user_stories` (только `status='published'`, фильтры `level`/`genre`/`is_free` (`price.is_(None)`/`price.isnot(None)`)/`author_id`), `has_story_access(story, user_id, db)` (бесплатная **или** свой автор **или** есть `StoryPurchases` на пару) — единая точка проверки доступа, переиспользуется и в 10.7 при покупке; `user_story_to_response` (каталожный dict без `body`); `get_user_story_detail(story_id, user_id, db)` — инкрементит `views_count` **на каждый просмотр** (не только на первый — как и запрошено в DoD буквально "инкремент views_count", без разговора об уникальности), затем добавляет ключ `'body'` в ответ только если `has_story_access` вернул `True` — тот же паттерн `response_model_exclude_none=True`, что и в 10.3.
- `router_user_story.py` — `GET /user-stories` (публичный каталог), `GET /user-stories/{id}` (требует авторизации — нужно знать `user_id`, чтобы решить доступ; `response_model_exclude_none=True`).
- Проверено вживую на реальных author/reader пользователях: опубликовал платную историю (`price=15`, с `description`); `GET` от лица **другого** пользователя (не купившего) → `body` в ответе физически отсутствует, `views_count` увеличился до `1`; вручную зафиксировал покупку (`StoryPurchases`) → повторный `GET` от того же читателя → `body` теперь **есть** с полным текстом, `views_count` стал `2`. Оба пункта DoD ("чужая платная без покупки — витрина, купленная — полный текст") подтверждены на одной и той же истории до и после покупки, не на двух разных. Тестовые данные подчищены.

### 10.7. Покупка истории (70/30)
- `crud_user_story.buy_story(story_id, buyer_id, db)` — переиспользует уже существующий `has_story_access` (из 10.6) и для проверки "уже куплена" (не дублирует логику отдельным запросом к `StoryPurchases`); порядок проверок: история существует и платная → не своя → ещё не куплена → тариф `can_buy_stories`; затем `purchase_service.purchase(..., item_type='user_story', seller_id=story.author_id, seller_share=Decimal('0.7'), create_entity=...)` — `create_entity` просто добавляет `StoryPurchases(story_id, buyer_id)`, вся денежная механика (списание/начисление/один commit/полный rollback при сбое) уже реализована и проверена в общем `purchase_service` (9.7) — здесь её заново не тестировал, чтобы не дублировать уже подтверждённую гарантию, только убедился, что `buy_story` её правильно вызывает.
- `router_user_story.py` — `POST /user-stories/{id}/buy`.
- Проверено вживую на реальных author/buyer: free-тариф покупателя → `403 CANNOT_BUY_STORIES`; после ручного апгрейда на `premium` и топ-апа на `200` — покупка истории за `100` → баланс покупателя стал `100.00` (списано ровно 100), баланс автора стал `70.00` (ровно 70% — не 69 и не 71); автор, пытающийся купить свою же историю → `400 CANNOT_BUY_OWN_STORY`; покупатель, пытающийся купить ту же историю повторно → `400 ALREADY_PURCHASED`. Все пункты DoD подтверждены на реальных числах. Тестовые данные подчищены.

### 10.8. Упражнения: создание и прохождение
- `crud_user_story.create_story_exercise` — только автор (`AppError('NOT_STORY_AUTHOR', ..., 403)` для остальных); `get_story_exercises`; `submit_story_exercises` — доступ проверяется тем же `has_story_access`, что и для чтения текста (буквально "доступ как к тексту" из ТЗ, не отдельная проверка); сравнение ответа без регистра/пробелов (паттерн из 5.11/7.7), пишет `StoryExerciseAttempts` на каждый ответ, за каждый верный — `ratings.award_xp(user_id, 'review_passed', db)` (тот же reason, что и для грамматических упражнений в 7.7 — "прохождение упражнения" концептуально одно и то же, отдельного XP-reason под UGC-упражнения не заводилось).
- `schema_user_story.py` — `ExerciseSubmitResult` (total/correct).
- `router_user_story.py` — `POST /user-stories/{id}/exercises`, `POST /user-stories/{id}/exercises/submit`.
- Проверено вживую на реальных author/other пользователях: чужой пользователь → `POST .../exercises` → `403 NOT_STORY_AUTHOR`; автор → тот же запрос → `200`, упражнение создано; прохождение с верным ответом → `{"total":1,"correct":1}`, и прямой проверкой в БД подтвердил обе стороны DoD одновременно: `StoryExerciseAttempts` содержит `is_correct=True`, и `XpTransactions` содержит `review_passed/10` для того же пользователя — "прохождение пишет попытки и XP" в одном тесте, не раздельно. Тестовые данные подчищены.

### 10.9. Отзывы и оценки
- `Backend/app/models/model_user_story.py` — `StoryReviews` (`story_id`, `user_id`, `rating`, `text` nullable, `UniqueConstraint` на пару). Миграция `alembic/versions/ef91a7f8e815_add_story_reviews_and_ratings.py`, цикл `upgrade → downgrade -1 → upgrade` чист.
- `crud_user_story.create_story_review` — доступ проверяется тем же `has_story_access` (отзыв только после чтения/покупки, как и упражнения в 10.8); дубликат по паре `(story_id, user_id)` → `AppError('ALREADY_REVIEWED', ..., 400)`; после создания отзыва — `ratings.award_xp(story.author_id, 'review_received', db)` — XP получает **автор истории**, а не сам рецензент (иначе "review_received" не имело бы смысла как reason). `get_story_reviews`.
- `get_average_rating(story_id, db)` — `AVG(rating)`, округление до 2 знаков, `None` при отсутствии отзывов; `get_user_stories` теперь возвращает обогащённые dict'ы (`{**user_story_to_response(story), 'average_rating': ...}`) вместо голых ORM-объектов — необходимо, т.к. `average_rating` не колонка таблицы.
- `schema_user_story.py` — `UserStoryResponse` пополнен `average_rating: float | None = None` (дефолт важен: у `create`/`update`/`publish`/`cover` роутов response всё ещё голый ORM-объект без этого атрибута — Pydantic с `from_attributes=True` корректно подставляет дефолт, когда атрибута нет, проверено вживую отдельно, не только предположил).
- `router_user_story.py` — `POST/GET /user-stories/{id}/reviews`.
- Проверено вживую на реальных author/reader: первый отзыв (`rating=5`) → `200`; повторный отзыв того же пользователя на ту же историю → `400 ALREADY_REVIEWED`; `GET /user-stories?author_id=...` в каталоге показал `average_rating: 5.0` для этой истории; в БД `XpTransactions` для автора содержит `review_received/15`; отдельно проверил, что `PATCH /user-stories/{id}` (возвращает голый ORM-объект) не падает и корректно отдаёт `average_rating: null`, а не ошибку сериализации. Все пункты DoD подтверждены. Тестовые данные подчищены.
