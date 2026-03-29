# Stack Research

**Domain:** Discord music bot + web dashboard + Lavalink
**Researched:** 2026-03-30
**Confidence:** HIGH (aligned with `init.md` and common Discord bot practice)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 20 LTS | Bot + API runtime | discord.js and ecosystem target modern Node |
| discord.js | v14.x | Discord gateway + interactions | De facto standard; interactions, components, voice helpers |
| Lavalink | 4.x compatible client | Audio streaming | Offloads decoding/streaming; no local FFmpeg burden on bot process |
| MongoDB | 7+ / Atlas | Playlists + analytics | Document model fits nested playlists and event logs |
| Next.js | 15.x (App Router) | Dashboard on Vercel | OAuth callback pages, server components for API proxy patterns |
| TypeScript | 5.x | Shared types across monorepo | Safer contracts between bot, API, and packages |

### Supporting Libraries

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `shoukaku` or `lavalink-client` | Lavalink node connection | Bot ↔ Lavalink protocol |
| `mongoose` or native driver | Mongo access | `packages/db` |
| `next-auth` or custom OAuth | Discord OAuth for web | Session for dashboard |
| `zod` | Env + API validation | Shared in `packages/config` / API |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm workspaces | Monorepo linking | Matches `apps/*` + `packages/*` |
| Java 17+ | Run Lavalink.jar | Local + VPS |
| Docker (optional) | Lavalink/API compose | Simplifies local parity |

## What NOT to Use (v1)

- **yt-dlp / direct download pipelines in the bot** — conflicts with "lightweight bot" + Lavalink-first design unless explicitly needed as Lavalink source plugin
- **Storing audio on disk or S3 for playback** — out of scope per product rules

## Installation (high level)

1. Java + `Lavalink.jar` + `application.yml` (password, server port)
2. MongoDB URI
3. Discord application: bot token, OAuth2 client id/secret, redirect URLs for Next.js
4. Node monorepo: `pnpm install`, per-app `dev` scripts
