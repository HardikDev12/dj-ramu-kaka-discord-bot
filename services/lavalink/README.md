# Lavalink

## What went wrong if you see “Invalid or corrupt jarfile”

A file named `Lavalink.jar` must be the **real binary** from GitHub. If someone saved `application.yml` (text) as `Lavalink.jar`, Java will reject it. This repo keeps config in `application.yml` only; you download the JAR separately.

## Setup

1. Install **Java 17 or newer** (Lavalink 4 will **not** run on Java 8). Check: `java -version` → major version **17+**.  
   - Windows: [Eclipse Temurin 17+](https://adoptium.net/) or another JDK 17+ distribution.
2. Download **`Lavalink.jar`** from **[Lavalink releases](https://github.com/lavalink-devs/Lavalink/releases/latest)** (Assets → `Lavalink.jar`) and save it **in this folder** next to `application.yml`:
   - `services/lavalink/Lavalink.jar`
3. Match **`lavalink.server.password`** in `application.yml` with **`LAVALINK_PASSWORD`** in the repo root `.env` (and what Shoukaku uses).
4. Run **from this directory** so Lavalink finds `application.yml`:

```bash
cd services/lavalink
java -jar Lavalink.jar
```

Merge any extra options from the [official `application.yml` example](https://github.com/lavalink-devs/Lavalink/blob/master/LavalinkServer/application.yml.example) if needed.
