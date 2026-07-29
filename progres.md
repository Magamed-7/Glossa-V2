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
