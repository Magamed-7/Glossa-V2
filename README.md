<div align="center">

# Glossa

**A language learning platform built like production infrastructure, not a course project.**

Spaced repetition, an AI conversation partner, live voice calls over WebRTC, and a content pipeline in three languages, all running behind real Docker services on a real domain.

[**Open glossa.best**](https://glossa.best) &nbsp;·&nbsp; [Author: Magamed-7](https://github.com/Magamed-7) &nbsp;·&nbsp; [Email](mailto:teachermaga7@gmail.com)

**[English](#english)** &nbsp;|&nbsp; **[Русский](#русский)** &nbsp;|&nbsp; **[Тоҷикӣ](#тоҷикӣ)**

</div>

---

## English

### What this actually is

Glossa is a full language learning product: leveled courses (Beginner through Upper-Intermediate) in English, Russian, and Tajik, spaced-repetition vocabulary cards driven by the SM-2 algorithm, grammar drills, user-written stories with exercises and reviews, an achievement and streak system, and an AI tutor you can actually talk to, by text or by voice, over a live WebRTC call. It ships with its own Telegram bot and a subscription/billing layer. This is not a demo seeded with fake data, it is the platform currently running for real users at glossa.best.

### Architecture

Glossa is split into two backend runtimes on purpose: Django owns identity, FastAPI owns everything real-time and content-heavy.

- **`fastapi_main`** — the core API: courses, cards, stories, grammar, achievements, subscriptions, social/follow graph
- **`fastapi_websocket`** — a dedicated service for live voice-call signaling and streaming AI conversation, kept off the main API process so a long-lived call can't starve normal requests
- **`auth_service`** (Django) — accounts, sessions, and auth, isolated from the content API by design
- **PostgreSQL** — system of record, migrated through Alembic on the FastAPI side
- **Redis** — cache, session store, and the Celery broker (separate DB indexes for cache vs. queue)
- **Celery**, split into dedicated queues: `priority`, `content`, `notifications`, `ai`, `analytics`, `payments`, plus a `beat` scheduler, so a slow AI job never blocks a notification email
- **Kafka-style consumers** (`ai_consumer`, `analytics_consumer`, `payments_consumer`, `content_consumer`) for event-driven work off the request path
- **MinIO** — S3-compatible object storage for avatars, story images, pronunciation audio, story audio, and chat attachments
- **Elasticsearch** — full-text search over content
- **coturn** — a self-hosted TURN server so voice calls actually connect through NAT/firewalls, not just on the same LAN
- **Telegram bot** — a parallel client into the same backend
- **Frontend** — React

### What I personally built

I designed and built the full system end to end: the data model, the FastAPI and Django services, the Celery/consumer pipeline, the WebRTC voice-call plumbing including the TURN server, the AI tutor integration, the trilingual content pipeline, and the deployment (Docker Compose, nginx, TLS) on the VPS this actually runs on. I also ran a full security pass on this codebase, fixing real issues (open CORS, IDOR on story/lingo endpoints, a 2FA throttle bypass, and vulnerable dependency versions) that are visible in the commit history.

### Running it

```bash
cd Backend
cp .env.example .env   # fill in real secrets
docker compose --profile full up -d --build
```

Exposes FastAPI on `:8000`, the websocket service on `:8002`, Django auth on `:8001`, MinIO console on `:9001`, and Elasticsearch on `:9200`. The frontend lives in `Frontend/` and runs independently (`pnpm install && pnpm dev`).

### Contact

Looking at this for a role or a project: [github.com/Magamed-7](https://github.com/Magamed-7) · [teachermaga7@gmail.com](mailto:teachermaga7@gmail.com)

---

## Русский

### Что это

Glossa, это полноценная платформа для изучения языков: курсы по уровням (от Beginner до Upper-Intermediate) на английском, русском и таджикском, карточки со spaced repetition на алгоритме SM-2, грамматические тренажёры, пользовательские истории с упражнениями и отзывами, система достижений и streak, и AI-репетитор, с которым можно говорить текстом или голосом, через живой звонок по WebRTC. Есть собственный Telegram-бот и слой подписок/оплаты. Это не демо на тестовых данных, это платформа, которая прямо сейчас работает для реальных пользователей на glossa.best.

### Архитектура

Бэкенд намеренно разделён на два рантайма: Django отвечает за identity, FastAPI, за всё остальное.

- **`fastapi_main`** — основное API: курсы, карточки, истории, грамматика, достижения, подписки, подписки/фолловинг
- **`fastapi_websocket`** — отдельный сервис для сигналинга голосовых звонков и стриминга AI-диалога, вынесен из основного процесса, чтобы долгий звонок не блокировал обычные запросы
- **`auth_service`** (Django) — аккаунты, сессии и аутентификация, изолированы от контентного API намеренно
- **PostgreSQL** — основное хранилище, миграции через Alembic на стороне FastAPI
- **Redis** — кэш, хранилище сессий и брокер Celery (разные индексы БД под кэш и очередь)
- **Celery** с отдельными очередями: `priority`, `content`, `notifications`, `ai`, `analytics`, `payments`, плюс планировщик `beat`, чтобы медленная AI-задача не блокировала письмо с уведомлением
- **Консьюмеры событий** (`ai_consumer`, `analytics_consumer`, `payments_consumer`, `content_consumer`) для асинхронной обработки вне пути запроса
- **MinIO** — S3-совместимое хранилище для аватаров, изображений историй, аудио произношения, аудио историй и вложений чата
- **Elasticsearch** — полнотекстовый поиск по контенту
- **coturn** — собственный TURN-сервер, чтобы голосовые звонки реально соединялись через NAT/файрвол, а не только в одной локальной сети
- **Telegram-бот** — параллельный клиент к тому же бэкенду
- **Frontend** — React

### Что сделал лично я

Я спроектировал и построил всю систему целиком: модель данных, сервисы на FastAPI и Django, пайплайн Celery/консьюмеров, голосовые звонки по WebRTC вместе с TURN-сервером, интеграцию AI-репетитора, трёхъязычный контент-пайплайн и деплой (Docker Compose, nginx, TLS) на реальном сервере, где всё это и работает. Также провёл полный security-аудит кодовой базы и закрыл реальные уязвимости (открытый CORS, IDOR на эндпоинтах историй и lingo-сервиса, обход троттлинга 2FA и уязвимые версии зависимостей), это видно в истории коммитов.

### Запуск

```bash
cd Backend
cp .env.example .env   # заполнить реальные секреты
docker compose --profile full up -d --build
```

FastAPI поднимается на `:8000`, websocket-сервис на `:8002`, Django auth на `:8001`, консоль MinIO на `:9001`, Elasticsearch на `:9200`. Фронтенд лежит в `Frontend/` и запускается отдельно (`pnpm install && pnpm dev`).

### Контакты

Если смотрите этот проект по работе или заказу: [github.com/Magamed-7](https://github.com/Magamed-7) · [teachermaga7@gmail.com](mailto:teachermaga7@gmail.com)

---

## Тоҷикӣ

### Ин чист

Glossa як платформаи пурраи омӯзиши забон аст: курсҳо аз рӯи сатҳ (аз Beginner то Upper-Intermediate) бо забонҳои англисӣ, русӣ ва тоҷикӣ, корточкаҳои луғавӣ бо усули такрори фосилавӣ (spaced repetition) дар асоси алгоритми SM-2, машқҳои грамматикӣ, ҳикояҳои корбарон бо машқ ва баррасӣ, системаи дастовард ва streak, ва як AI-муаллим, ки метавон бо ӯ бо матн ё бо овоз тавассути занги зинда бо WebRTC сӯҳбат кард. Инчунин боти Telegram ва қабати обуна/пардохт мавҷуд аст. Ин демо бо маълумоти сохта нест, ин ҳамон платформае аст, ки ҳозир барои корбарони воқеӣ дар glossa.best кор мекунад.

### Меъморӣ

Бэкенд қасдан ба ду хидмат тақсим шудааст: Django масъули шахсият (identity), FastAPI масъули ҳама чизи дигар.

- **`fastapi_main`** — API асосӣ: курсҳо, корточкаҳо, ҳикояҳо, грамматика, дастовардҳо, обунаҳо, шабакаи иҷтимоӣ/пайравӣ
- **`fastapi_websocket`** — хидмати алоҳида барои сигналинги занги овозӣ ва стриминги гуфтугӯи AI, то занги дароз просесси асосиро банд накунад
- **`auth_service`** (Django) — ҳисобҳо, сессияҳо ва аутентификатсия, қасдан аз API-и контент ҷудо шудааст
- **PostgreSQL** — анбори асосии додаҳо, миграция тавассути Alembic дар тарафи FastAPI
- **Redis** — кэш, анбори сессия ва брокери Celery (индексҳои гуногуни база барои кэш ва навбат)
- **Celery** бо навбатҳои алоҳида: `priority`, `content`, `notifications`, `ai`, `analytics`, `payments`, плюс ҷадвалбандии `beat`
- **Консюмерҳои воқеаҳо** (`ai_consumer`, `analytics_consumer`, `payments_consumer`, `content_consumer`) барои коркарди асинхронӣ
- **MinIO** — анбори объектии мувофиқ бо S3 барои аватарҳо, тасвирҳои ҳикоя, аудиои талаффуз, аудиои ҳикоя ва замимаҳои чат
- **Elasticsearch** — ҷустуҷӯи пурраи матн дар контент
- **coturn** — сервери шахсии TURN, то занги овозӣ тавассути NAT/файрвол воқеан пайваст шавад
- **Боти Telegram** — муштарии параллелӣ ба ҳамон бэкенд
- **Frontend** — React

### Ман шахсан чӣ сохтам

Ман тамоми системаро аз аввал то охир тарҳрезӣ ва сохтам: модели додаҳо, хидматҳои FastAPI ва Django, хатти Celery/консюмерҳо, занги овозии WebRTC якҷоя бо сервери TURN, интегратсияи AI-муаллим, хатти контенти сезабона ва деплойро (Docker Compose, nginx, TLS) дар сервере, ки ҳамааш дар он кор мекунад. Инчунин аудити пурраи амниятии коди лоиҳаро гузаронидам ва масъалаҳои воқеиро бартараф кардам (CORS-и кушод, IDOR дар эндпоинтҳои ҳикоя ва lingo-хидмат, гузариш аз троттлинги 2FA ва версияҳои осебпазири вобастагиҳо), ки дар таърихи коммитҳо намоён аст.

### Роҳандозӣ

```bash
cd Backend
cp .env.example .env   # сирри воқеиро пур кунед
docker compose --profile full up -d --build
```

FastAPI дар `:8000`, хидмати websocket дар `:8002`, Django auth дар `:8001`, консоли MinIO дар `:9001`, Elasticsearch дар `:9200` бардошта мешавад. Frontend дар `Frontend/` ҷойгир аст ва алоҳида кор мекунад (`pnpm install && pnpm dev`).

### Тамос

Агар ин лоиҳаро барои кор ё фармоиш дида истодаед: [github.com/Magamed-7](https://github.com/Magamed-7) · [teachermaga7@gmail.com](mailto:teachermaga7@gmail.com)
