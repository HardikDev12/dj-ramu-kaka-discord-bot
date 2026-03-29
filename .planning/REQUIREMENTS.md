# Requirements: DJ Ramu Kaka — Discord Music Bot System

**Defined:** 2026-03-30
**Core Value:** Guild members can reliably play music from names or URLs with a queue, Lavalink streaming, and playlist workflows (Discord + web), without storing audio files.

## v1 Requirements

### Foundation & infrastructure

- [ ] **INFRA-01**: Repository matches target layout: `apps/bot`, `apps/api`, `apps/web`, `packages/db`, `packages/utils`, `packages/config`, `services/lavalink` (and optional `services/ai` placeholder)
- [ ] **INFRA-02**: Monorepo tooling works (workspace installs, shared TypeScript baseline, per-app dev entrypoints documented)
- [ ] **DB-01**: MongoDB playlist documents support user id, name, and track list with metadata (`title`, `url`, `duration`) as in `init.md`
- [ ] **DB-02**: MongoDB analytics collection accepts play events (`track`, `userId`, `timestamp` or equivalent)
- [ ] **DB-03**: `.env.example` (or equivalent) lists all required variables without real secrets
- [ ] **LAV-01**: Single Lavalink node can run locally with documented `LAVALINK_HOST` / `LAVALINK_PORT` alignment
- [ ] **NFR-01**: System does not persist audio media files; only metadata and events
- [ ] **NFR-02**: Playback uses Lavalink streaming to Discord voice

### API (VPS)

- [ ] **API-01**: Web user can sign in with Discord OAuth and maintain an authenticated session for dashboard calls
- [ ] **API-02**: Authenticated user can create, read, update, and delete their own playlists via HTTP API
- [ ] **API-03**: Bot or API can record play analytics matching the agreed schema
- [ ] **API-04**: Admin can invoke remote actions (stop playback, clear queue, set volume) via authorized API, affecting the target guild/player
- [ ] **API-05**: Admin-only endpoints reject users whose Discord id is not in `ADMIN_IDS`

### Discord bot

- [ ] **BOT-01**: User can request playback by song name or URL in a guild; audio streams via Lavalink
- [ ] **BOT-02**: User can manage transport: queue visibility, pause, skip, stop (behaviors documented per command)
- [ ] **BOT-03**: Playback UI uses Discord buttons (and related components) where specified in product design
- [ ] **BOT-04**: User can select playlists from a dropdown (or equivalent component) to enqueue or play
- [ ] **BOT-05**: User can create playlists, add the current track, add by search, play a playlist, and maintain multiple playlists (synced with persisted store)

### Web dashboard (Vercel)

- [ ] **WEB-01**: User can log in with Discord and reach a logged-in area
- [ ] **WEB-02**: User can manage playlists (create/edit/delete as defined by API) in the web UI
- [ ] **WEB-03**: User can view playlist tracks in the web UI
- [ ] **WEB-04**: Admin can access an admin area showing analytics summaries (users, playlists, play counts) and controls aligned with API-04

### Launch readiness

- [ ] **OPS-01**: README documents local run order (Lavalink → API → bot → web) consistent with `init.md`
- [ ] **OPS-02**: README documents production split: Next.js on Vercel; API, bot, Lavalink on VPS; required env vars
- [ ] **SEC-01**: Production configuration addresses HTTPS, CORS or same-site rules, and secure session handling between Vercel and API

## v2 Requirements

### Scaling & platform

- **SCALE-01**: Redis for sessions or job signaling between API and bot
- **SCALE-02**: Multi-node Lavalink with failover
- **SCALE-03**: Service split and load balancing as traffic grows

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hosting audio files or CDN-backed music libraries | Explicit architecture rule in `init.md` |
| Email/password or non-Discord user accounts | Discord OAuth only for v1 |
| Mobile native apps | Web + Discord only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| DB-03 | Phase 1 | Pending |
| LAV-01 | Phase 1 | Pending |
| NFR-01 | Phase 1 | Pending |
| NFR-02 | Phase 1 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 2 | Pending |
| API-04 | Phase 2 | Pending |
| API-05 | Phase 2 | Pending |
| BOT-01 | Phase 3 | Pending |
| BOT-02 | Phase 3 | Pending |
| BOT-03 | Phase 3 | Pending |
| BOT-04 | Phase 3 | Pending |
| BOT-05 | Phase 3 | Pending |
| WEB-01 | Phase 4 | Pending |
| WEB-02 | Phase 4 | Pending |
| WEB-03 | Phase 4 | Pending |
| WEB-04 | Phase 4 | Pending |
| OPS-01 | Phase 5 | Pending |
| OPS-02 | Phase 5 | Pending |
| SEC-01 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after initial definition*
