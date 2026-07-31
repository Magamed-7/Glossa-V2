# Glossa Frontend

React 18 + Vite 5 + Tailwind CSS v4 single-page app implementing the "Neo-Retro Editorial" design
(`design/design.html`, an 11-screen Google Stitch mockup — see `Plan/DESIGN_SYSTEM.md` for the token
breakdown). English/Russian/Tajik interface, JWT auth against the two backend services below, real-time
AI tutor chat over WebSocket.

The backend integration contract — base URLs, auth flow, error format, pagination, locales, the WebSocket
AI chat protocol, and the full endpoint list — is at
[`../docs/FRONTEND_CONTRACT.md`](../docs/FRONTEND_CONTRACT.md). Backend setup/run instructions are at
[`../Backend/README.md`](../Backend/README.md).

## Running locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

Copy `.env.example` to `.env` and point it at your running backend services:

```bash
VITE_AUTH_URL=http://127.0.0.1:8001   # Django auth_service
VITE_API_URL=http://127.0.0.1:8000    # FastAPI app
VITE_WS_URL=ws://127.0.0.1:8002       # FastAPI websocket_app (AI chat)
```

## Backend services this app talks to

Three services must be running (natively or via `Backend/docker-compose.yml`) for the app to be usable
end to end:

| Service | Port | Owns |
|---|---|---|
| `auth_service` (Django) | 8001 | Users, JWT issuance/refresh, 2FA, password change |
| `app` (FastAPI) | 8000 | Everything else — deck, stories, grammar, social, marketplace, payments |
| `websocket_app` (FastAPI) | 8002 | AI tutor chat over WebSocket |

## Design source

The Stitch-generated mockup this app is built from lives at `design/design.html`. The implementation plan,
design-token breakdown, API contract notes, and image-generation manifest are under `Plan/` (gitignored —
local planning docs, not shipped). Any backend endpoint the plan needed but the API doesn't provide yet is
listed with a reproduction and a default/fallback in `Plan/MISSING_API.md`.
