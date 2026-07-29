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
