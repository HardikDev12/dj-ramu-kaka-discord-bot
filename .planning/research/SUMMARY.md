# Project Research Summary

**Project:** DJ Ramu Kaka — Discord Music Bot System
**Domain:** Discord music bot + Lavalink + split web/API hosting
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

The product is a **classical split architecture**: a **Node discord.js bot** drives voice and Lavalink, a **VPS-hosted API** owns data and privileged actions, and a **Next.js dashboard** on Vercel provides OAuth-based management and admin analytics. Research aligns fully with `init.md`: **MongoDB** for playlists and play events, **no audio storage**, and **single-node Lavalink** for v1. Main risks are **OAuth redirect configuration**, **server-side admin enforcement**, and **Lavalink/voice lifecycle** handling—all addressable in early phases.

## Key Findings

### Recommended Stack

See `STACK.md`. Core: **Node 20 LTS**, **discord.js v14**, **Lavalink 4.x client**, **MongoDB**, **Next.js 15**, **TypeScript**, **pnpm workspaces**.

### Expected Features

**Table stakes:** play/search, queue, transport controls, guild isolation, persisted playlists per Discord user.

**Competitive / vision:** web playlist management, admin analytics and remote control, rich Discord components (buttons, dropdowns).

**Defer:** Redis, multi-node Lavalink, microservice split, non-Discord login.

### Architecture Approach

See `ARCHITECTURE.md`. Clear boundaries: Vercel = web only; VPS = API + bot + Lavalink; shared packages for config and DB types.

### Critical Pitfalls

1. OAuth redirect mismatch — fix env/docs per environment.
2. Client-only admin checks — always verify on API/bot.
3. Lavalink desync — explicit reconnection and queue policies.
4. Accidental audio downloads — enforce metadata-only storage.
5. Concurrent playlist writes — use atomic Mongo updates.

## Implications for Roadmap

### Phase 1: Foundation

**Rationale:** Nothing works without repo layout, Mongo contracts, and a running Lavalink node.
**Delivers:** Monorepo skeleton, `packages/db` schemas, local Lavalink story, env templates.

### Phase 2: API & data plane

**Rationale:** Web and admin features need authorized HTTP + persistence.
**Delivers:** Discord OAuth sessions, playlist + analytics APIs, `ADMIN_IDS` enforcement.

### Phase 3: Bot & playback

**Rationale:** Core user value is voice playback with queue and components.
**Delivers:** Lavalink integration, commands, buttons/dropdowns, playlist command suite.

### Phase 4: Web dashboard

**Rationale:** Dashboard consumes API; depends on stable contracts from Phase 2.
**Delivers:** Next.js UI for playlists, track views, admin sections.

### Phase 5: Integration & launch readiness

**Rationale:** Cross-hosting (Vercel + VPS) needs CORS, cookies, and runbooks.
**Delivers:** Production checklist, README deployment paths, end-to-end validation notes.

### Phase Ordering Rationale

Data and API precede web admin; bot can be parallelized after DB shapes exist but benefits from API for playlist source of truth—roadmap sequences **Foundation → API → Bot → Web → Launch**.

### Research Flags

- **Phase 3:** Bot↔API signaling for admin actions may need a concrete pattern (HTTP vs DB command queue).
- **Phase 4:** OAuth and cookie security across domains — plan explicitly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Standard Discord + Lavalink stack |
| Features | HIGH | Driven by `init.md` |
| Architecture | HIGH | Common split deployment |
| Pitfalls | MEDIUM-HIGH | Ops details validated at implementation |

**Overall confidence:** HIGH

### Gaps to Address

- **Admin → bot control transport:** Choose during Phase 2/3 planning (minimal v1: polling or internal HTTP).
- **YouTube/source plugin policy:** Confirm Lavalink source plugins allowed in target hosting environment.

## Sources

### Primary

- `init.md` — authoritative scope
- discord.js / Lavalink official documentation (to be pinned to exact versions during Phase 1 execution)

### Secondary

- Community patterns for Shoukaku/Lavalink v4 with discord.js v14

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
