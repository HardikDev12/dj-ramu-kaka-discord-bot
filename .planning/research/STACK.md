# Stack Research — Discord Music Bot + Dashboard

**Researched:** 2026-03-30  
**Confidence:** HIGH

## Recommended stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Bot | discord.js v14, Shoukaku | De facto standard; Shoukaku supports Lavalink v4 REST/WebSocket |
| Audio | Lavalink 4.x (Java 17+) | Required for legal streaming via sources; no local audio storage |
| API | Express, `cors`, `cookie-session` or JWT | Simple VPS deployment; pair with Discord OAuth2 |
| Web | Next.js (App Router), React | Matches `init.md`; Vercel-friendly |
| DB | MongoDB + Mongoose | Matches schema examples in `init.md`; flexible for playlists + analytics |
| Monorepo | npm workspaces | No extra tooling; `@music-bot/db` etc. |

## Versions (verify at install time)

- Node.js LTS (22.x or 20.x)
- Java 17+ for Lavalink 4
- `mongoose` 8.x, `discord.js` 14.x, `shoukaku` 4.x (align with Lavalink major)

## What to avoid

- **Bundling Lavalink inside Node** — separate process only  
- **youtube-dl / arbitrary download-to-disk** — conflicts with “no audio storage” and ToS risk  
- **Single Next.js API replacing Express** — violates three-app split in `init.md`
