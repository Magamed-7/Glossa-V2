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
