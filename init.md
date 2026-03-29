# 🎧 Discord Music Bot System – FINAL Architecture (With Admin Panel)

# Logo ane in current directory is logo-bg.png

## 🧠 Overview
Complete system including:
- **Web** — separate Next.js app (dashboard UI only; not the API)
- **API** — separate Express backend (REST/auth/data; not the bot process)
- **Bot** — separate Discord client (commands, voice, Lavalink player; bot-specific code only)
- Playlist system, admin dashboard, analytics, AI-ready structure

**Do not merge** web + API + bot into one app or one folder. Each has its own `package.json`, dev server, and deployment target.

---

## 🏗️ Architecture

Three **independent** runtimes that talk over HTTP and shared MongoDB:

| Layer | What it is | Not |
|-------|------------|-----|
| **Web** (`apps/web`) | Next.js frontend, Discord OAuth UI, admin panels | Not the API server; not Discord gateway code |
| **API** (`apps/api`) | Express routes, controllers, services, auth checks | Not Next.js pages; not the Discord bot process |
| **Bot** (`apps/bot`) | Discord.js, slash commands, voice, Lavalink client | Not serving the website; not replacing the REST API |

```
Browser → Web (Next.js) ──HTTP──→ API (Express) ──→ MongoDB (metadata)
Discord  → Bot (Discord.js) ──→ MongoDB / API (your choice per feature) ──→ Lavalink (:2333) ──→ voice
```

Web never hosts bot logic. API never replaces the Discord gateway. Bot never serves the Next.js UI.

The **web** is only the UI; it never runs bot or Lavalink code. The **API** is the shared backend for dashboards and (optionally) the bot. The **bot** is Discord- and voice-specific. **Lavalink** is a separate process, not embedded in Node.

---

## 👑 User Types

```
1. Normal User (Discord OAuth)
2. Admin (via Discord ID check)
```

---

## 🔐 Authentication

- Discord OAuth (no signup needed)
- Admin identified via ENV

```
ADMIN_IDS=your_discord_id
```

---

## 📁 Folder Structure (monorepo, separate apps)

```
dj-ramu-kaka/                    # root: npm workspaces, one `npm run dev` for all apps
│
├── apps/
│   ├── web/      → Next.js only (frontend / dashboard)
│   ├── api/      → Express only (HTTP API)
│   └── bot/      → Discord bot only (gateway + voice + player)
│
├── packages/
│   ├── db/       → MongoDB models + connection (shared)
│   ├── config/   → shared env / constants
│   └── utils/    → shared helpers
│
├── services/
│   ├── lavalink/ → Java Lavalink (separate process)
│   └── ai/       → optional AI service (separate)
│
├── package.json  # workspaces: apps/*, packages/*
├── .env
└── README.md
```

---

## 🎵 Core Features

- Play song (name / URL)
- Queue system
- Pause / Skip / Stop
- Buttons UI
- Dropdown playlist selector

---

## 📂 Playlist Features

- Create playlist
- Add current song
- Add by search
- Play playlist
- Multiple playlists per user

---

## 🌐 Web Dashboard

- Login via Discord
- Manage playlists
- View songs
- Admin panel

---

## 👑 Admin Features

### 📊 Analytics
- Total users
- Total playlists
- Track play count

### 🎛️ Control
- Stop playback
- Clear queue
- Change volume

### 👥 User Management
- View users
- Activity tracking

### 📂 Playlist Control
- Edit/delete any playlist

---

## 💾 Database (MongoDB)

### Playlist Example
```
{
  userId: "...",
  name: "Chill",
  tracks: [
    {
      title: "Faded",
      url: "...",
      duration: 210000
    }
  ]
}
```

---

## 📊 Analytics Collection

```
{
  track: "Faded",
  userId: "...",
  timestamp: "..."
}
```

---

## 🎧 Lavalink

- Single node (for now)
- Opus streaming
- No audio storage

---

## 🔐 ENV CONFIG

```
DISCORD_TOKEN=xxx
CLIENT_ID=xxx
MONGO_URI=xxx
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
ADMIN_IDS=your_id
```

---

## 🚀 Local Setup

### All-in-one (monorepo root)
Requires **Java 17+** on PATH and `Lavalink.jar` in `services/lavalink/`. MongoDB is separate if you use playlists.
```
npm install
npm run dev
```
Starts API, bot, web, and Lavalink. Use `npm run dev:no-lava` if Lavalink runs in another terminal.

### Lavalink (manual)
Download `Lavalink.jar` from [Lavalink releases](https://github.com/lavalink-devs/Lavalink/releases/latest) into `services/lavalink/`, then:
```
cd services/lavalink
java -jar Lavalink.jar
```
Requires **Java 17+**.

### API
```
cd apps/api
npm run dev
```

### Bot
```
cd apps/bot
node index.js
```

### Web
```
cd apps/web
npm run dev
```

---

## ⚡ Key Rules

- ❌ Do NOT merge `apps/web`, `apps/api`, and `apps/bot` into one app or one process
- ❌ Do NOT store audio files
- ✅ Store only metadata in MongoDB
- ✅ Use Lavalink for streaming
- ✅ Keep the bot focused on Discord + voice; keep HTTP concerns in the API

---

## 🔥 Future Scaling

- Add Redis
- Multi-node Lavalink
- Microservices split
- Load balancing

---

## 🏁 Final Notes

This system is:
- Free-tier ready
- Scalable
- Admin-controlled
- Production-ready
