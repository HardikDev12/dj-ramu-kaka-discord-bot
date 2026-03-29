# Roadmap: DJ Ramu Kaka — Music Bot System

## Overview

Deliver the three-app monorepo with shared MongoDB models and Lavalink configuration first, then the Express API (OAuth + playlists + analytics ingestion), then the Discord bot with full playback and playlist UX, then the Next.js dashboard, and finally admin analytics and control features that tie API and bot together.

## Phases

- [x] **Phase 1: Foundation & shared packages** — Workspaces, `@music-bot/*`, DB schemas, Lavalink config docs  
- [x] **Phase 2: API core** — Express app, OAuth, playlist CRUD, analytics write path, health  
- [ ] **Phase 3: Bot & Lavalink** — discord.js + Shoukaku, slash commands, queue, buttons/playlist flows  
- [ ] **Phase 4: Web dashboard** — Next.js auth against API, playlist UI  
- [ ] **Phase 5: Admin & analytics UI** — Totals, user views, admin playback controls, global playlist management  

## Phase details

### Phase 1: Foundation & shared packages

**Goal:** Runnable monorepo skeleton with shared database layer and documented Lavalink setup.  
**Depends on:** Nothing  
**Requirements:** INFRA-01, INFRA-02, INFRA-03  
**Success criteria:**

1. `npm install` at root installs all workspaces without errors  
2. `@music-bot/db` can connect to MongoDB using `MONGO_URI` and export models  
3. Developer can start Lavalink using root `Lavalink.jar` and `services/lavalink/application.yml` instructions  

**UI hint:** no  

**Plans:** 2 plans  

Plans:

- [x] 01-01: Workspace layout, root scripts, `.env.example`, `.gitignore`  
- [x] 01-02: Mongoose models + Lavalink `application.yml` + README runbook  

### Phase 2: API core

**Goal:** Authenticated REST API for playlists and analytics events.  
**Depends on:** Phase 1  
**Requirements:** API-01, API-02, API-03, API-05  
**Success criteria:**

1. `GET /health` returns 200 JSON  
2. Discord OAuth completes and session/token works for subsequent API calls  
3. User can CRUD own playlists via API; payloads match metadata-only rule  
4. Play events can be recorded in the analytics collection  

**UI hint:** no  

**Plans:** 3 plans  

Plans:

- [x] 02-01: Express bootstrap, CORS, error middleware, health  
- [x] 02-02: Discord OAuth routes + session strategy  
- [x] 02-03: Playlist + analytics routes wired to `@music-bot/db`  

### Phase 3: Bot & Lavalink

**Goal:** Production-capable music bot connected to Lavalink with core commands and rich controls.  
**Depends on:** Phase 2 (for playlist data; may stub read from DB directly if API not yet called)  
**Requirements:** BOT-01, BOT-02, BOT-03, BOT-04, BOT-05  
**Success criteria:**

1. Bot stays connected and responds to registered slash commands  
2. Play command joins voice and audio is heard when Lavalink is healthy  
3. Pause/skip/stop/queue behave consistently across guilds  
4. Buttons/select menus work for transport and playlist pickers  
5. Playlist add/play flows use stored playlist metadata  

**UI hint:** no (Discord UI components only)  

**Plans:** 3 plans  

Plans:

- [ ] 03-01: Client, intents, Shoukaku nodes, slash command registration  
- [ ] 03-02: Play/queue/pause/skip/stop implementation  
- [ ] 03-03: Buttons, dropdown playlist selector, playlist CRUD from Discord  

### Phase 4: Web dashboard

**Goal:** Next.js UI for login and playlist management.  
**Depends on:** Phase 2  
**Requirements:** WEB-01, WEB-02  
**Success criteria:**

1. User can log in with Discord via the web app  
2. User can list playlists and edit tracks (metadata) through the UI  
3. Web uses API base URL from env (no bot secrets in browser)  

**UI hint:** yes  

**Plans:** 2 plans  

Plans:

- [ ] 04-01: Next.js app shell, auth callback flow, protected layout  
- [ ] 04-02: Playlist pages + forms calling API  

### Phase 5: Admin & analytics UI

**Goal:** Admin-only surfaces for metrics, users, playback control, and global playlist moderation.  
**Depends on:** Phase 3, Phase 4  
**Requirements:** API-04, WEB-03, ADM-01, ADM-02, ADM-03  
**Success criteria:**

1. Non-admin cannot access admin routes (API + web)  
2. Admin dashboard shows user count, playlist count, aggregate play counts  
3. Admin can stop/clear/volume via agreed mechanism (e.g. API command queue consumed by bot)  
4. Admin can list users/activity and edit/delete any playlist  

**UI hint:** yes  

**Plans:** 2 plans  

Plans:

- [ ] 05-01: Admin API routes + bot control channel (polling/Redis/WebSocket as chosen in plan)  
- [ ] 05-02: Admin Next.js pages for analytics and moderation  

## Progress

**Execution order:** 1 → 2 → 3 → 4 → 5  

| Phase | Plans complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-30 |
| 2. API core | 3/3 | Complete | 2026-03-30 |
| 3. Bot & Lavalink | 0/3 | Not started | - |
| 4. Web dashboard | 0/2 | Not started | - |
| 5. Admin & analytics | 0/2 | Not started | - |
