# Features Research — Music Bot + Admin Dashboard

## Table stakes (v1)

- Slash (or prefix) commands: play by query/URL, queue display, skip, pause, resume, stop
- Voice channel join/leave tied to guild/user expectations
- Persistent playlists per Discord user (metadata only)
- Web OAuth login; CRUD playlists in dashboard
- Basic analytics: play events (track title, user, timestamp)
- Admin gate: analytics totals, user list, forced playlist edits, playback control signals (API → bot integration in later phase)

## Differentiators (defer unless in `init.md`)

- Multi-node Lavalink, Redis queues, AI recommendations (`services/ai` placeholder)

## Anti-features

- Hosting MP3s or caching full tracks to disk
- Collapsing web + API + bot into one deployable
