# DJ Ramu Kaka — music bot system

Monorepo: **Next.js** (`apps/web`), **Express** (`apps/api`), **Discord bot** (`apps/bot`), plus **Lavalink** (Java). See [`init.md`](./init.md) for architecture rules (three apps must stay separate).

## Quick start

1. Copy `.env.example` → `.env` and fill values ([external setup](#what-you-need-externally)).
2. Install: `npm install` (repo root).
3. Start MongoDB locally or use Atlas. Verify: `npm run db:ping` (needs `MONGO_URI` in `.env`).
4. **Lavalink JAR:** Download `Lavalink.jar` from [releases](https://github.com/lavalink-devs/Lavalink/releases/latest) into `services/lavalink/` (**Java 17+** on your PATH — not Java 8). See `services/lavalink/README.md`.
5. If **port 3000** is busy (Next.js), set `WEB_PORT` (e.g. `3100`) in `.env` and set **`WEB_ORIGIN`** to match.
6. **One command** — API, bot, web, and Lavalink together:

   ```bash
   npm run dev
   ```

   To run only the three Node apps (Lavalink already running elsewhere): `npm run dev:no-lava`.

   **MongoDB** is still its own process (local install or Atlas); the API starts without it but playlist routes need `MONGO_URI`.

## Add the bot to your Discord server

### From the web (recommended)

1. Ensure **`CLIENT_ID`** is set in the repo root `.env` (used automatically for `/add-bot`; optional **`NEXT_PUBLIC_DISCORD_CLIENT_ID`** overrides it).
2. Start the web app (`npm run dev:web` or `npm run dev`).
3. Open **`/add-bot`** (e.g. `http://localhost:3100/add-bot` if you use `WEB_PORT=3100`) and click **Add to Discord**.

### From the terminal (optional)

```bash
npm run discord:invite-url
```

**Or** use the [Developer Portal](https://discord.com/developers/applications) → **OAuth2** → **URL Generator** with scopes **`bot`** + **`applications.commands`**.

After the bot joins, it appears in the member list.

## Slash commands (music testing)

1. **Lavalink** must be running (`services/lavalink` + Java 17+).
2. Set **`DISCORD_GUILD_ID`** in `.env` to your server’s ID (Discord → Settings → Advanced → Developer Mode → right‑click server → **Copy Server ID**). Guild commands show up in **seconds**. If you leave it empty, commands register **globally** and can take **~1 hour** to appear.
3. Restart the bot (`npm run dev:bot`). It registers commands on startup. You can also run:

   ```bash
   npm run register-commands -w @music-bot/bot
   ```

4. In the server, **join a voice channel**, then in text type **`/`** and use:

   | Command | What it does |
   |---------|----------------|
   | `/play` | URL or search. Default Lavalink config has **YouTube off** — try a direct **HTTP/HTTPS** stream URL or **`scsearch:artist track`** (SoundCloud). |
   | `/pause` / `/resume` | Transport |
   | `/skip` | Next in queue or stop |
   | `/queue` / `/nowplaying` | Queue / current track |
   | `/stop` | Stop, clear queue, leave voice |

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
