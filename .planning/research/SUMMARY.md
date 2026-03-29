# Project Research Summary

**Project:** DJ Ramu Kaka — Discord Music Bot System  
**Domain:** Discord bot + web admin + REST API + Lavalink  
**Researched:** 2026-03-30  
**Confidence:** HIGH

## Executive Summary

The product is a three-app monorepo: Next.js dashboard, Express API, and a Discord.js bot, plus a separate Lavalink Java server. MongoDB holds playlist metadata and play analytics only. This matches common 2025–2026 patterns for self-hosted music bots (Lavalink 4 + Shoukaku + discord.js). Main risks are OAuth configuration, Lavalink credentials, and resisting scope creep that merges the apps.

## Key Findings

### Recommended stack

- **Bot:** discord.js 14 + Shoukaku → Lavalink 4  
- **API:** Express + MongoDB/Mongoose + Discord OAuth2  
- **Web:** Next.js (App Router)  
- **Workspaces:** `@music-bot/db`, `@music-bot/config`, `@music-bot/utils`

### Table stakes

Playback controls, queues, playlists (Discord + web), OAuth login, basic analytics, admin ID gate.

### Watch out for

Intent configuration in the Discord portal, Lavalink `application.yml` vs env parity, and source/plugin availability for Lavalink (keep versions aligned).

## Roadmap implications

Build shared DB and Lavalink wiring first, then API (auth + data), then bot (voice), then web UI, then admin/analytics depth.
