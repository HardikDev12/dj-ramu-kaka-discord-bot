# Architecture Research

## Components

1. **Browser** → Next.js (`apps/web`) — UI only; calls API over HTTPS
2. **API** (`apps/api`) — OAuth callback, sessions, REST for playlists, admin routes, analytics aggregation
3. **Bot** (`apps/bot`) — Discord gateway, voice, Shoukaku ↔ Lavalink; may read Mongo or call API per feature
4. **Lavalink** — Java process; receives play requests from bot; streams Opus to Discord
5. **MongoDB** — playlists, users mirror, analytics events

## Data flow

- **Web auth**: OAuth redirect to Discord → API stores session → web uses session cookie or token
- **Playback**: User command in Discord → bot resolves track via Lavalink REST → node plays → optional analytics write to Mongo
- **Playlist play**: Bot loads playlist doc (API or DB) → enqueues tracks to Lavalink

## Suggested build order

1. Shared packages + DB schemas + Lavalink config  
2. API foundation + OAuth + playlist REST  
3. Bot + Lavalink integration + core commands  
4. Web dashboard  
5. Admin + analytics UI + control plane
