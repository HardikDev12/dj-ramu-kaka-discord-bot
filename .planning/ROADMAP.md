# Roadmap: DJ Ramu Kaka — Discord Music Bot System

## Overview

Build the monorepo foundation and data contracts first, stand up the authenticated API, deliver the Lavalink-backed bot experience, add the Next.js dashboard and admin views, then close the loop with cross-host security and deployment documentation. Phases follow dependency order: **Foundation → API → Bot → Web → Launch**.

## Phases

- [ ] **Phase 1: Foundation** — Monorepo, Mongo schemas, Lavalink local, env templates, non-functional guarantees (no audio storage)
- [ ] **Phase 2: API & auth** — Discord OAuth sessions, playlist + analytics APIs, admin routes with `ADMIN_IDS`
- [ ] **Phase 3: Discord bot** — Lavalink playback, queue/transport, components, playlist command suite backed by persistence
- [ ] **Phase 4: Web dashboard** — Next.js on Vercel: login, playlist management, admin analytics/control UI
- [ ] **Phase 5: Launch readiness** — Production security between hosts, README runbooks, end-to-end validation

## Phase Details

### Phase 1: Foundation

**Goal:** Runnable skeleton with database contracts and Lavalink dev story; no feature UI yet.
**Depends on:** Nothing (first phase)
**Requirements:** INFRA-01, INFRA-02, DB-01, DB-02, DB-03, LAV-01, NFR-01, NFR-02
**UI hint**: no
**Success Criteria** (what must be TRUE):

1. `pnpm` (or chosen package manager) installs all workspaces without errors
2. Playlist and analytics shapes are defined in code and documented
3. Lavalink starts locally and bot/API configs can point at it via env
4. `.env.example` exists and matches variables listed in `init.md` (plus OAuth secrets needed for later phases)

**Plans:** TBD (set during `/gsd-plan-phase 1`)

Plans:

- [x] 01-01: Scaffold monorepo folders and workspace config
- [x] 01-02: Implement `packages/db` models and validation
- [x] 01-03: Lavalink `services/lavalink` docs + local run instructions

### Phase 2: API & auth

**Goal:** HTTP API with Discord OAuth and secure admin operations for later bot wiring.
**Depends on:** Phase 1
**Requirements:** API-01, API-02, API-03, API-04, API-05
**UI hint**: no
**Success Criteria** (what must be TRUE):

1. User can complete OAuth and call an authenticated `/me`-style endpoint
2. CRUD on own playlists returns correct ownership errors for others' data
3. Analytics ingest endpoint accepts events the bot will emit
4. Non-admin receives 403 on admin routes; admin succeeds when `ADMIN_IDS` matches

**Plans:** TBD

Plans:

- [ ] 02-01: OAuth session layer and user binding
- [ ] 02-02: Playlist REST (or tRPC) routes + Mongo persistence
- [ ] 02-03: Admin routes + bot control contract (HTTP or queue — as planned)

### Phase 3: Discord bot

**Goal:** Full guild playback experience with queue, components, and playlists.
**Depends on:** Phase 1–2 (Phase 2 required if bot reads playlists via API; adjust if shared DB only)
**Requirements:** BOT-01, BOT-02, BOT-03, BOT-04, BOT-05
**UI hint**: yes (Discord components)
**Success Criteria** (what must be TRUE):

1. Play command streams audio in a voice channel via Lavalink
2. Pause/skip/stop behave consistently with documented rules
3. Buttons/dropdowns function without stale message errors under normal use
4. Playlist create/add/play flows persist and match web-visible data

**Plans:** TBD

Plans:

- [ ] 03-01: Lavalink client wiring + play/search
- [ ] 03-02: Queue + transport commands
- [ ] 03-03: Message components + playlist UX
- [ ] 03-04: Integration tests or manual test script for voice (documented)

### Phase 4: Web dashboard

**Goal:** Vercel-hosted UI for users and admins consuming the API.
**Depends on:** Phase 2 (Phase 3 for realistic E2E with live playback optional but recommended)
**Requirements:** WEB-01, WEB-02, WEB-03, WEB-04
**UI hint**: yes
**Success Criteria** (what must be TRUE):

1. Discord login works in deployed/preview environment with correct redirects
2. User can perform full playlist lifecycle from the browser
3. Track list renders for each playlist
4. Admin sees aggregate analytics and can trigger controls that hit API-04

**Plans:** TBD

Plans:

- [ ] 04-01: Next.js app shell + OAuth client flow
- [ ] 04-02: Playlist pages
- [ ] 04-03: Admin dashboard sections

### Phase 5: Launch readiness

**Goal:** Safe production configuration and operator documentation.
**Depends on:** Phase 4
**Requirements:** OPS-01, OPS-02, SEC-01
**UI hint**: no
**Success Criteria** (what must be TRUE):

1. README allows a new dev to run the full stack locally
2. README describes VPS + Vercel env separation clearly
3. CORS/cookies/session settings documented and verified for production URLs

**Plans:** TBD

Plans:

- [ ] 05-01: Hardening checklist + SEC-01 verification
- [ ] 05-02: README and ops runbook polish

## Progress

**Execution Order:** Phases 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Plans done — verify & transition | - |
| 2. API & auth | 0/3 | Not started | - |
| 3. Discord bot | 0/4 | Not started | - |
| 4. Web dashboard | 0/3 | Not started | - |
| 5. Launch readiness | 0/2 | Not started | - |
