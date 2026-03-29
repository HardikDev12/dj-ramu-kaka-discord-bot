# DJ Ramu Kaka — Discord Music Bot System

## What This Is

A full-stack **Discord music bot** with **playlists**, **Lavalink-backed streaming** (no stored audio), a **Next.js admin/dashboard** on Vercel, and a **Node.js API** intended for an Oracle VPS. Normal users authenticate with **Discord OAuth**; **admins** are gated by Discord user IDs in environment configuration. The repo target layout is a monorepo: `apps/bot`, `apps/api`, `apps/web`, shared `packages/*`, and `services/lavalink` (plus optional `services/ai` for future use). Brand asset: `logo-bg.png` in the project root (per `init.md`).

## Core Value

Guild members can **reliably play music from names or URLs** with a **queue**, **Lavalink streaming**, and **playlist workflows** (Discord + web), without the system storing audio files—only metadata and analytics events.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Monorepo scaffold: `apps/bot`, `apps/api`, `apps/web`, `packages/db`, `packages/utils`, `packages/config`, `services/lavalink`
- [ ] MongoDB models for playlists (user-bound, track metadata) and analytics events
- [ ] Lavalink single-node integration (Opus streaming, no audio persistence)
- [ ] Discord bot: play, queue, pause, skip, stop, button UI, playlist dropdown
- [ ] Playlist CRUD: create, add current track, add by search, play playlist, multiple playlists per user
- [ ] API on VPS: auth/session for web, playlist and analytics APIs, admin actions (stop, clear queue, volume, user visibility, playlist moderation)
- [ ] Next.js web: Discord login, playlist management, song views, admin panel
- [ ] Environment-driven admin allowlist (`ADMIN_IDS`)

### Out of Scope

- **Storing audio files** — violates architecture; use Lavalink-only streaming
- **Redis, multi-node Lavalink, microservice split, load balancing** — explicit future scaling (`init.md`); not v1
- **Non-Discord auth for end users** — OAuth is Discord-only for v1

## Context

Architecture flow: **Discord / Web → Next.js (Vercel) → API (VPS) → Bot + Lavalink → Discord voice**. Database: **MongoDB**. Bot must stay lightweight; metadata and play analytics live in Mongo. AI-ready structure is reserved under `services/ai` without committing to a provider in v1.

## Constraints

- **Tech**: Node.js for bot and API; Next.js for web; MongoDB; Lavalink (Java); discord.js + Lavalink client stack (to be finalized in implementation)
- **Hosting**: Web on Vercel; API + bot + Lavalink on VPS (Oracle per vision)
- **Compliance / cost**: Free-tier friendly where possible; no audio file storage
- **Security**: Secrets only via env; admin checks server-side using `ADMIN_IDS`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo (`apps/` + `packages/` + `services/`) | Matches `init.md`; shared types and DB access | — Pending |
| MongoDB for playlists + analytics | Specified in `init.md`; flexible document model | — Pending |
| Lavalink for all playback | Required for scalable streaming without storing media | — Pending |
| Discord OAuth for web; ENV-based admins | No separate signup; simple admin model for small teams | — Pending |
| Next.js on Vercel, API on VPS | Clear split: static/edge UI vs long-lived bot/API | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 after initialization*
