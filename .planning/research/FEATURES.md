# Features Research

**Domain:** Discord music bots + creator dashboards
**Researched:** 2026-03-30
**Confidence:** HIGH

## Table stakes (users expect)

- Play by query or URL; visible queue; skip / pause / stop
- Stable voice connection and reconnection basics
- Per-guild (server) queue isolation
- Playlist persistence tied to user identity (here: Discord user id)

## Differentiators (from `init.md`)

- **Unified web dashboard** with Discord OAuth for the same playlists
- **Admin panel**: analytics (users, playlists, play counts), remote playback control, user visibility, global playlist moderation
- **Rich Discord UI**: buttons + dropdown for playlist selection
- **AI-ready** folder without shipping AI in v1

## Anti-features / defer

- Audio file hosting or CDN for music files
- Redis caching layer (future scaling)
- Multi-node Lavalink cluster (future)
- Email/password auth for dashboard

## Dependencies between features

- Web dashboard **depends on** API + OAuth + Mongo playlist API
- Bot **depends on** Lavalink + shared track metadata shape with API
- Admin analytics **depends on** bot/API emitting play events

## Complexity notes

| Area | Complexity | Note |
|------|------------|------|
| Lavalink + discord.js | Medium | Connection lifecycle, voice state |
| Discord OAuth + sessions | Medium | Redirect URLs, secure cookies |
| Admin cross-cutting | Medium | Must enforce `ADMIN_IDS` on server only |
