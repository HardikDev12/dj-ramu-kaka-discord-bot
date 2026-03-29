# Requirements: DJ Ramu Kaka — Music Bot System

**Defined:** 2026-03-30  
**Core Value:** Users can queue and control music in Discord and manage playlists on the web, using metadata + Lavalink only (no stored audio files).

## v1 Requirements

### Monorepo & infrastructure

- [ ] **INFRA-01**: Repository uses npm workspaces for `apps/*` and `packages/*` per `init.md`
- [ ] **INFRA-02**: `@music-bot/db` exposes Mongo connection and playlist + analytics models aligned with `init.md` examples
- [ ] **INFRA-03**: `services/lavalink/application.yml` documents a single node; local run path documented (root `Lavalink.jar`)

### API (`apps/api`)

- [ ] **API-01**: HTTP server exposes health check and JSON error shape suitable for the web app
- [ ] **API-02**: User can complete Discord OAuth and obtain a session usable by the web app for authenticated requests
- [ ] **API-03**: Authenticated user can create, list, read, update, and delete their own playlists and tracks (metadata only)
- [ ] **API-04**: Admin (per `ADMIN_IDS`) can list all users/playlists and modify or delete any playlist
- [ ] **API-05**: Server accepts play-analytics events (or writes them when called by the bot) with track, userId, timestamp

### Bot (`apps/bot`)

- [ ] **BOT-01**: Bot connects to Discord with required intents and registers slash commands for core music actions
- [ ] **BOT-02**: User can play audio by name or URL in a voice channel via Lavalink (single-node)
- [ ] **BOT-03**: User can pause, resume, skip, and stop playback; queue is visible/updated
- [ ] **BOT-04**: Message or interaction UI includes buttons (and/or selects) for transport controls and playlist selection where specified in `init.md`
- [ ] **BOT-05**: User can add the current track to a playlist, add by search, and play a saved playlist (multiple playlists per user)

### Web (`apps/web`)

- [ ] **WEB-01**: User can sign in with Discord and sign out
- [ ] **WEB-02**: User can manage playlists and view tracks through the dashboard
- [ ] **WEB-03**: Admin sees admin panel sections gated by API (analytics + controls as implemented in API/bot)

### Admin & analytics

- [ ] **ADM-01**: Admin can view totals: users, playlists, track play counts (from analytics collection)
- [ ] **ADM-02**: Admin can trigger stop playback, clear queue, and set volume (end-to-end with bot — may use API + bot polling/websocket in later iteration)
- [ ] **ADM-03**: Admin can view users and basic activity derived from stored events

## v2 Requirements

### Scaling & platform

- **SCALE-01**: Redis for sessions or job queues  
- **SCALE-02**: Multi-node Lavalink and load balancing  
- **SCALE-03**: Dedicated `services/ai` integration for recommendations or natural-language queueing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Storing audio files on disk or S3 | Explicit non-goal; Lavalink streams only |
| Single combined Next.js + bot process | Violates `init.md` separation |
| Mobile native apps | Web-first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 2 | Pending |
| API-04 | Phase 5 | Pending |
| API-05 | Phase 2 | Pending |
| BOT-01 | Phase 3 | Pending |
| BOT-02 | Phase 3 | Pending |
| BOT-03 | Phase 3 | Pending |
| BOT-04 | Phase 3 | Pending |
| BOT-05 | Phase 3 | Pending |
| WEB-01 | Phase 4 | Pending |
| WEB-02 | Phase 4 | Pending |
| WEB-03 | Phase 5 | Pending |
| ADM-01 | Phase 5 | Pending |
| ADM-02 | Phase 5 | Pending |
| ADM-03 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 17 total  
- Mapped to phases: 17  
- Unmapped: 0 ✓  

---
*Requirements defined: 2026-03-30*  
*Last updated: 2026-03-30 after roadmap creation*
