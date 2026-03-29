# Pitfalls Research

**Domain:** Discord music bots + Lavalink + split hosting
**Researched:** 2026-03-30
**Confidence:** HIGH

## 1. OAuth redirect URL mismatch

**Warning signs:** `redirect_uri` errors, infinite login loops.
**Prevention:** Document exact Vercel preview vs production URLs; one Discord app or separate OAuth credentials per environment.
**Phase:** Phase 4 (Web) + Phase 2 (API).

## 2. Admin checks only in the client

**Warning signs:** "Admin" UI visible to everyone; IDOR on playlist/admin routes.
**Prevention:** Enforce `ADMIN_IDS` (and role checks if added later) on **API and bot** only.
**Phase:** Phase 2 (API), Phase 3 (Bot).

## 3. Lavalink / voice desync

**Warning signs:** Bot thinks it is playing; no audio; 404 on tracks.
**Prevention:** Health check Lavalink; handle node disconnected events; clear queue on voice disconnect policy.
**Phase:** Phase 1 (infra), Phase 3 (Bot).

## 4. Storing copyright audio

**Warning signs:** Downloading full tracks to disk, growing storage.
**Prevention:** Metadata-only in Mongo; stream via Lavalink per product rule.
**Phase:** All phases — code review gate.

## 5. Bot/API database race conditions

**Warning signs:** Playlist updates lost under concurrent web edit + bot "add current".
**Prevention:** Atomic updates (e.g. Mongo positional operators) or version fields; single writer patterns where possible.
**Phase:** Phase 2–3.
