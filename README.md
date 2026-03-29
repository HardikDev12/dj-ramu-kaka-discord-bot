# DJ Ramu Kaka — music bot system

Monorepo: **Discord bot**, **API** (VPS), **Next.js dashboard** (Vercel), **Lavalink**, **MongoDB**. See `init.md` and `.planning/PROJECT.md` for product context.

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9](https://pnpm.io/) (`corepack enable` then `corepack prepare pnpm@9.15.0 --activate`)
- **MongoDB** URI (local or Atlas)
- **Java 17+** + **Lavalink.jar** for local audio (see `services/lavalink/README.md`)

## Install

```bash
pnpm install
```

## Environment

Copy `.env.example` to `.env` and fill values. Never commit `.env`.

## Local run order

1. **MongoDB** — running and reachable via `MONGO_URI`
2. **Lavalink** — `cd services/lavalink` → copy `application.yml.example` to `application.yml` → `java -jar Lavalink.jar`
3. **API** — `pnpm dev:api` (Phase 2 adds real HTTP)
4. **Bot** — `pnpm dev:bot` (Phase 3 adds discord.js)
5. **Web** — `pnpm dev:web` → [http://localhost:3000](http://localhost:3000) (Phase 4 adds OAuth UI)

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `pnpm dev:api` | API workspace dev              |
| `pnpm dev:bot` | Bot workspace dev              |
| `pnpm dev:web` | Next.js dev server             |
| `pnpm build`   | Production build (web app)     |
| `pnpm typecheck` | Typecheck all workspaces     |

## Layout

```
apps/bot      # Discord bot (Phase 3+)
apps/api      # HTTP API (Phase 2+)
apps/web      # Next.js dashboard (Phase 4+)
packages/db   # Mongoose models + Zod schemas
packages/config # Env parsing (Zod)
packages/utils  # Shared helpers
services/lavalink  # Lavalink config + docs
services/ai   # Reserved for future AI features
```

## GSD

Planning artifacts live in `.planning/`. Next step after Phase 1: **`/gsd-plan-phase 2`** (API & auth).
