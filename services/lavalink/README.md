# Lavalink (local / VPS)

The bot streams audio through **Lavalink** — no audio files are stored in this repo.

## Prerequisites

- **Java 17+** (`java -version`)
- **Lavalink.jar** from [Lavalink releases](https://github.com/lavalink-devs/Lavalink/releases) (use a v4 build compatible with your client library)

## Setup

1. Copy `application.yml.example` to `application.yml` (this path is gitignored).
2. Download `Lavalink.jar` into this folder (`services/lavalink/` is gitignored for the JAR — keep it local).
3. Align the **password** and **port** with root `.env` / `.env.example` (`LAVALINK_PASSWORD`, `LAVALINK_PORT`).

## Run

```bash
cd services/lavalink
java -jar Lavalink.jar
```

Default HTTP: `http://127.0.0.1:2333` — the bot will use `LAVALINK_HOST` / `LAVALINK_PORT` in Phase 3.

## Notes

- YouTube / other sources depend on **Lavalink plugins** and Lavalink version; add plugins under `lavalink.plugins` in `application.yml` per upstream docs.
- Production: run Lavalink on the same VPS as the bot or a private network with firewall rules — do not expose the Lavalink port publicly without TLS and auth.
