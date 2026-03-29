# Architecture Research

**Domain:** Discord music system (bot + API + web + Lavalink)
**Researched:** 2026-03-30
**Confidence:** HIGH

## Major components

1. **apps/web (Next.js)** — User/admin UI; Discord OAuth; calls API for playlists and admin actions.
2. **apps/api (Node)** — REST (or RPC-style) HTTP; MongoDB; issues authorized operations; may signal bot via shared queue/Redis later; v1 can use HTTP webhooks or direct DB flags read by bot.
3. **apps/bot (Node)** — discord.js; voice; Lavalink client; slash commands + message components; reads/writes playlists via API or shared `packages/db` (decision in Phase 2 planning).
4. **services/lavalink** — Java Lavalink node; single instance for v1.
5. **packages/db** — Schemas: playlists, analytics documents.
6. **packages/config** — Typed env loading (`DISCORD_TOKEN`, `CLIENT_ID`, `MONGO_URI`, `LAVALINK_*`, `ADMIN_IDS`, OAuth secrets).

## Data flow

- **Playback request** — User invokes bot command → bot resolves track via Lavalink → audio to voice channel; optional analytics write to Mongo.
- **Playlist edit on web** — User OAuth → API validates session → Mongo update → bot reads fresh data on next play or via cache invalidation pattern.
- **Admin stop/volume** — Admin UI → API (checks `ADMIN_IDS`) → mechanism to reach guild player (HTTP to bot, or shared DB command row polled by bot — choose in planning).

## Suggested build order

1. Repo + Mongo models + Lavalink running locally
2. API foundation + OAuth session + playlist CRUD
3. Bot playback + queue + UI components
4. Web dashboard + admin views
5. Wire admin controls + analytics completeness + deploy docs

## Boundaries

- **Vercel** hosts only Next.js; no long-lived Lavalink or bot on Vercel
- **VPS** hosts API, bot process, and Lavalink (or Lavalink on same VPS as API)
