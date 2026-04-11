# DJ Ramu Kaka — music bot system

Monorepo: **Next.js** (`apps/web`), **Express** (`apps/api`), **Discord bot** (`apps/bot`), plus **Lavalink** (Java). See [`init.md`](./init.md) for architecture rules (three apps must stay separate).

## Repository layout

```
Project/                          # repo root — `npm install` here
├── apps/
│   ├── api/                      # Express API (`@music-bot/api`)
│   ├── bot/                      # Discord bot (`@music-bot/bot`) — connects to Lavalink via Shoukaku
│   └── web/                      # Next.js (`@music-bot/web`)
├── packages/
│   ├── config/
│   ├── db/                       # shared Mongo models (API + bot)
│   └── utils/
├── services/
│   └── lavalink/                 # Lavalink runtime directory (Java, not Node)
│       ├── Lavalink.jar          # download from GitHub releases (not in git)
│       ├── application.yml       # port, password, bind address — must align with bot `.env`
│       └── logs/                 # created at runtime (see `logging.file.path` in application.yml)
├── scripts/
│   ├── run-lavalink.js           # `npm run dev` — runs `java -jar` with cwd = `services/lavalink/`
│   └── …
├── .env                          # copy from `.env.example` (repo root)
├── .env.example
└── package.json                  # workspaces + `dev` / `dev:no-lava`
```

### Lavalink connection (paths and env)

| What | Where |
|------|--------|
| Bot reads Lavalink settings | Root **`.env`**: `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD` (see [`.env.example`](./.env.example)) |
| Lavalink listens and password | **`services/lavalink/application.yml`** → `server.port`, `server.address`, and `lavalink.server.password` |
| JAR and config on disk | **`services/lavalink/Lavalink.jar`** + **`services/lavalink/application.yml`** (working directory for the Java process is `services/lavalink/`) |
| REST probe before WebSocket | Bot hits `http://{LAVALINK_HOST}:{LAVALINK_PORT}/v4/info` then connects to Lavalink v4 |

**Keep these in sync:** `LAVALINK_PORT` = `application.yml` `server.port`; `LAVALINK_PASSWORD` = `application.yml` `lavalink.server.password`.

### Oracle Cloud / private network (peer-style) deployment

Use this when the bot and Lavalink run on **different** instances in the same VCN (or any setup where the bot reaches Lavalink by **private IP**, not `127.0.0.1`):

1. On the **Lavalink** host, set **`server.address`** in `application.yml` to **`0.0.0.0`** so the server accepts connections on the instance’s VNIC address. The default `127.0.0.1` only accepts local connections and will block another VM’s bot.
2. On the **bot** host, set **`LAVALINK_HOST`** to that instance’s **private IP** (or internal DNS), and **`LAVALINK_PORT`** / **`LAVALINK_PASSWORD`** to match `application.yml`.
3. In **OCI** (or your firewall), allow **inbound** TCP on the Lavalink port (default **2333**) **only** from the bot’s subnet / security group — do not expose Lavalink to the public internet without TLS and strict controls.

If bot and Lavalink run on the **same** machine, you can keep `server.address: 127.0.0.1` and `LAVALINK_HOST=127.0.0.1`.

## Quick start

1. Copy `.env.example` → `.env` and fill values ([external setup](#what-you-need-externally)).
2. Install: `npm install` (repo root).
3. Start MongoDB locally or use Atlas. Verify: `npm run db:ping` (needs `MONGO_URI` in `.env`).
4. **Lavalink JAR:** Download `Lavalink.jar` from [releases](https://github.com/lavalink-devs/Lavalink/releases/latest) into `services/lavalink/`. You need **Java 17+** (not Java 8). If `java -version` still shows 8, install [Temurin 17+](https://adoptium.net/) and set **`JAVA_HOME`** to that JDK, or put the new `java` first on `PATH`. `npm run dev` will refuse to start Lavalink until Java 17+ is detected.
5. If **port 3000** is busy (Next.js), set `WEB_PORT` (e.g. `3100`) in `.env` and set **`WEB_ORIGIN`** to match.
6. **One command** — API, bot, web, and Lavalink together:

   ```bash
   npm run dev
   ```

   To run only the three Node apps (Lavalink already running elsewhere): `npm run dev:no-lava`.

   **MongoDB** is still its own process (local install or Atlas); the API starts without it but playlist routes need `MONGO_URI`.

## Deploy: API and bot on servers, frontend elsewhere

Use this layout when **Next.js** runs on one host (or Vercel/Netlify-style) and **Express + the Discord bot** run on your own servers. The browser only talks to the **web origin**; the web app proxies `/auth/*` and `/data/*` to the API (see `apps/web/next.config.mjs`).

```
                    ┌─────────────────┐
  Users (browser) ─►│  Next.js (WEB)  │  public URL = WEB_ORIGIN
                    └────────┬────────┘
                             │ server-side rewrites (API_INTERNAL_URL)
                             ▼
                    ┌─────────────────┐
                    │  Express (API)  │  MONGO_URI, OAuth, sessions
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         MongoDB         (optional)     same DB if bot uses playlists
                              │
┌─────────────┴─────────────┐ │
│ Bot + Lavalink (Node+Java)│ │  DISCORD_TOKEN, LAVALINK_*
└───────────────────────────┘ │
         ▲                    │
         │ voice / gateway    │
         └────────────────────┘ Discord
```

### What runs where

| Piece | Typical host | Notes |
|--------|----------------|-------|
| **MongoDB** | Atlas, or a DB VPS | Same `MONGO_URI` on API and bot if you use `/playlist` in Discord. |
| **API** (`apps/api`) | Small VPS / container | Port `API_PORT` (default `3001`). Must trust your reverse proxy (`trust proxy` is already enabled). |
| **Bot** (`apps/bot`) | Same machine as Lavalink *or* same private network | Bot must reach Lavalink: `LAVALINK_HOST` / `LAVALINK_PORT`. |
| **Lavalink** | With the bot | Java **17+**, `Lavalink.jar` in `services/lavalink/`, config in `application.yml`. |
| **Web** (`apps/web`) | Different server / PaaS | Build with env below; no Java or Lavalink on this host. |

Install dependencies **from the monorepo root** on any machine that builds or runs an app: `npm install`. Workspaces pull in `packages/db` for API and bot.

### 1. API server

1. Clone the repo, `npm install`, copy `.env.example` → `.env`.
2. Set at minimum:

   | Variable | Purpose |
   |----------|---------|
   | `MONGO_URI` | MongoDB connection string. |
   | `API_PORT` | Listen port (default `3001`). |
   | `WEB_ORIGIN` | **Public base URL of your frontend only**, e.g. `https://app.example.com` — no trailing slash. The API uses this for **CORS** (`Access-Control-Allow-Origin`) and redirects from `/`. |
   | `DISCORD_REDIRECT_URI` | Must be **`{WEB_ORIGIN}/auth/discord/callback`**, e.g. `https://app.example.com/auth/discord/callback`. Same value in the [Discord Developer Portal](https://discord.com/developers/applications) → OAuth2 → Redirects. |
   | `CLIENT_ID`, `CLIENT_SECRET` | Discord application OAuth2. |
   | `SESSION_SECRET` | Long random string; **required** when `NODE_ENV=production`. |
   | `ADMIN_IDS` | Comma-separated Discord user IDs for admin API routes. |

3. Start:

   ```bash
   set NODE_ENV=production   # Linux/macOS: export NODE_ENV=production
   npm run start -w @music-bot/api
   ```

4. Put a reverse proxy (nginx, Caddy, Traefik) in front if you expose the API publicly **only when needed**. Often the API is **private**: reachable only from the Next.js server over a VPC or internal URL — then you do not need a public API domain.

### 2. Bot (+ Lavalink) server

1. Same repo + `npm install`, share the same `.env` (or a trimmed env file) with:

   | Variable | Purpose |
   |----------|---------|
   | `DISCORD_TOKEN` | Bot token. |
   | `DISCORD_GUILD_ID` | Optional; guild ID for fast slash-command updates. |
   | `MONGO_URI` | Same as API if Discord playlists should use the DB. |
   | `LAVALINK_HOST` | `127.0.0.1` if Lavalink is local; otherwise the hostname/IP **as seen from this Node process**. |
   | `LAVALINK_PORT` | Default `2333`; must match `services/lavalink/application.yml`. |
   | `LAVALINK_PASSWORD` | Must match `application.yml` `server.password`. |

2. Install **Java 17+**, place `Lavalink.jar` under `services/lavalink/`, start Lavalink (see [services/lavalink/README.md](./services/lavalink/README.md)), then:

   ```bash
   npm run start -w @music-bot/bot
   ```

3. Register slash commands once per deploy or token change:

   ```bash
   npm run register-commands -w @music-bot/bot
   ```

**Firewall:** allow the bot host outbound HTTPS to Discord; if Lavalink is remote, allow `LAVALINK_PORT` between bot and Lavalink only (do not expose Lavalink to the public internet without auth and TLS).

### 3. Frontend server (different machine)

The UI calls **same-origin** paths: `/auth/...`, `/data/playlists`, etc. Next.js **rewrites** those to your API. The URL the Next **server** uses to reach the API is **`API_INTERNAL_URL`** (preferred) or **`NEXT_PUBLIC_API_URL`**.

1. On the build/run environment for `apps/web`, set:

   | Variable | Purpose |
   |----------|---------|
   | `WEB_ORIGIN` | Public site URL, **must match** API’s `WEB_ORIGIN` exactly (scheme + host + port). |
   | `API_INTERNAL_URL` | Base URL of the API **as reachable from the Next.js process** (e.g. `http://10.0.0.5:3001` or `https://api-private.internal`). Used in `next.config.mjs` rewrites. |
   | `CLIENT_ID` | Discord application ID (for invite links / `NEXT_PUBLIC_*` injection). |

2. Production build and start:

   ```bash
   set NODE_ENV=production
   npm run build -w @music-bot/web
   npm run start -w @music-bot/web
   ```

   `WEB_PORT` defaults to `3000`; set it if your host expects another port. Put TLS and your public hostname on a reverse proxy in front of Next.

3. **Cookies:** In production the API sets the session cookie with `Secure` and `SameSite=Lax`. Serve the **frontend over HTTPS** so the browser will send the cookie on `https://your-domain/...` requests to the same host.

### Checklist (split setup)

- [ ] Discord **Redirect URI** = `{WEB_ORIGIN}/auth/discord/callback` (Portal + API `.env`).
- [ ] API `WEB_ORIGIN` equals the browser’s origin for the Next app (CORS).
- [ ] Next `API_INTERNAL_URL` points to a URL the Next server can actually open (not `localhost` unless API is on the same machine).
- [ ] `SESSION_SECRET` set on API in production.
- [ ] MongoDB reachable from API; from bot too if using playlist features in Discord.
- [ ] Bot can reach Lavalink; Lavalink password matches `.env`.

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

- **Discord:** [Application](https://discord.com/developers/applications) with bot user, OAuth2 client id/secret, redirect URL for the web app, and intents as required by the bot (`Guilds`, `Guild Voice States`).
- **MongoDB:** Local, Docker, or [Atlas](https://www.mongodb.com/cloud/atlas); connection string in `MONGO_URI`.
- **Java 17+** for Lavalink on the machine that runs the music bot.
- **Split production:** follow [Deploy: API and bot on servers, frontend elsewhere](#deploy-api-and-bot-on-servers-frontend-elsewhere) and cross-check every variable in [`.env.example`](./.env.example).
