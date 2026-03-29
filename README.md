# DJ Ramu Kaka — music bot system

Monorepo: **Next.js** (`apps/web`), **Express** (`apps/api`), **Discord bot** (`apps/bot`), plus **Lavalink** (Java). See [`init.md`](./init.md) for architecture rules (three apps must stay separate).

## Quick start

1. Copy `.env.example` → `.env` and fill values ([external setup](#what-you-need-externally)).
2. Install: `npm install` (repo root).
3. Start MongoDB locally or use Atlas. Verify: `npm run db:ping` (needs `MONGO_URI` in `.env`).
4. Start **Lavalink** before the bot (otherwise Shoukaku logs connection errors): from `services/lavalink`, run `java -jar ../../Lavalink.jar` (Java 17+).
5. If **port 3000** is busy (Next.js), set `WEB_PORT` (e.g. `3100`) in `.env` and set **`WEB_ORIGIN`** to the same host/port (e.g. `http://localhost:3100`) so API CORS + OAuth redirects stay correct.
6. In separate terminals (or `npm run dev` for all Node apps):

   - `npm run dev:api`
   - `npm run dev:bot`
   - `npm run dev:web`

## GSD / planning

- Project context: [`.planning/PROJECT.md`](./.planning/PROJECT.md)
- Roadmap: [`.planning/ROADMAP.md`](./.planning/ROADMAP.md)
- Requirements: [`.planning/REQUIREMENTS.md`](./.planning/REQUIREMENTS.md)

Phase 2 (API core) is implemented: OAuth session, playlist CRUD, analytics ingest. Next: **Phase 3** (bot + Lavalink commands) or **`/gsd-plan-phase 3`**.

## API (`apps/api`)

Base URL: `http://localhost:3001` (or `API_PORT`). Errors use `{ "error": { "code", "message" } }`.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Liveness |
| GET | `/auth/discord?next=/path` | Redirect to Discord OAuth (`next` must be same-origin path) |
| GET | `/auth/discord/callback` | Discord redirect (configure in Developer Portal) |
| GET | `/auth/me` | Current user or 401 |
| POST | `/auth/logout` | Clears session cookie |
| GET | `/api/playlists` | Session required; lists your playlists |
| POST | `/api/playlists` | Body `{ "name", "tracks"? }` |
| GET/PATCH/DELETE | `/api/playlists/:id` | Owner only |
| POST | `/api/analytics/plays` | Body `{ "track" }` as logged-in user, or `{ "track", "userId" }` with header `X-Internal-Key: $BOT_INTERNAL_KEY` for the bot |

Env: `CLIENT_ID`, `CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `WEB_ORIGIN`, `SESSION_SECRET` (required in production), `MONGO_URI`, optional `BOT_INTERNAL_KEY`.

## What you need externally

See **“What you need externally”** in the assistant’s summary or expand your deployment checklist from `.env.example` and `init.md`.
