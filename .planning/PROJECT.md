# DJ Ramu Kaka — Discord Music Bot System

## What This Is

A monorepo for a Discord music bot with playlists, a Next.js web dashboard (UI only), an Express API (REST, auth, data), and a separate Discord bot process for voice and Lavalink playback. Normal users sign in with Discord OAuth; admins are gated by Discord user IDs in environment configuration. The stack targets a free-tier friendly deployment (e.g. Next on Vercel, API on a VPS, bot + Lavalink on the same or another host).

## Core Value

Users can discover music, queue and control playback in Discord voice channels, and manage playlists from both Discord and the web, without storing audio files—only metadata and analytics in MongoDB, with Lavalink handling streams.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Three independent runtimes: `apps/web`, `apps/api`, `apps/bot` (no merged processes)
- [ ] MongoDB metadata for playlists and play analytics (no audio blobs)
- [ ] Lavalink as separate Java process for streaming
- [ ] Discord OAuth for web; admin via `ADMIN_IDS`
- [ ] Core playback: play, queue, pause, skip, stop, button UI, playlist selector
- [ ] Web: login, playlist management, song listing, admin panel
- [ ] Admin: analytics, playback control hooks, user visibility, global playlist edit/delete

### Out of Scope

- **Storing audio files** — violates architecture; use Lavalink only
- **Merging web/API/bot into one Node app** — breaks deployment and security boundaries
- **Redis, multi-node Lavalink, load balancing** — future scaling (see `init.md`)

## Context

- Source architecture: `init.md` (authoritative for folder layout and boundaries)
- Logo asset: `logo-bg.png` at repo root
- Lavalink JAR present at repo root: `Lavalink.jar` (run separately; `services/lavalink` holds `application.yml` example)

## Constraints

- **Architecture**: Web must not run bot or Lavalink code; API must not replace Discord gateway; bot must not serve the Next.js UI
- **Stack**: Node.js (workspaces), Next.js (web), Express (api), discord.js + Lavalink client (bot), MongoDB, Java for Lavalink
- **Deployment**: Web may target Vercel; API/bot/Lavalink expect a long-running host (e.g. Oracle VPS as noted in original vision)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| npm workspaces monorepo | Single repo, shared `@music-bot/*` packages | — Pending |
| Separate `apps/web`, `apps/api`, `apps/bot` | Matches `init.md` and independent scaling | — Pending |
| Mongoose in `@music-bot/db` | Shared schemas for API and optional bot DB access | — Pending |

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
*Last updated: 2026-03-30 after GSD new-project initialization*
