# Deploy helper: Oracle Cloud (API + bot) · Vercel (web) · MongoDB Atlas · CI/CD

This guide is for developers shipping **DJ Ramu Kaka** with:

| Component | Host | Notes |
|-----------|------|--------|
| **Next.js** (`apps/web`) | **Vercel** | Browser origin = `WEB_ORIGIN`; rewrites proxy `/auth/*`, `/data/*` to the API. |
| **Express API** (`apps/api`) | **Oracle Cloud Compute** | Holds `MONGO_URI`, OAuth, session cookie logic. |
| **Discord bot** (`apps/bot`) + **Lavalink** | **Same Oracle VM** (typical) | Bot reaches Lavalink on `LAVALINK_HOST` / `LAVALINK_PORT`. |
| **MongoDB** | **Atlas** (or other cloud Mongo) | API and bot use the same `MONGO_URI` if you use Discord playlists. |

Monorepo layout and Lavalink paths are summarized in the root [README.md](../README.md) (repository layout section).

---

## 1. MongoDB Atlas (cloud database)

1. Sign in at [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a **project**.
2. **Build a database** → choose **M0** (free) or a paid tier → pick a **region** close to your Oracle region (lower latency).
3. **Database access** → **Add new database user**:
   - Authentication: **Password**.
   - Save username and password (you will put them in `MONGO_URI`).
4. **Network access** → **Add IP Address**:
   - For a quick test: **Allow access from anywhere** (`0.0.0.0/0`) — acceptable only with a **strong** random password and TLS (Atlas default).
   - **Recommended:** add your **Oracle Compute instance’s public egress IP** (and any other fixed hosts that connect). Vercel **does not** need to be allowlisted for Mongo if only the API (on Oracle) talks to Mongo; the Next app proxies to the API.
5. **Database** → **Connect** → **Drivers** → copy the **connection string** (SRV form), e.g. `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/music-bot?retryWrites=true&w=majority`.
6. Put that value in **`.env`** on the Oracle server (and locally) as **`MONGO_URI`**. Replace `<password>` with the URL-encoded password if it contains special characters.

**Verify from your laptop (optional):**

```bash
# From repo root, with MONGO_URI in .env
npm run db:ping
```

---

## 2. Oracle Cloud Infrastructure (OCI) — API + bot (+ Lavalink)

### 2.1 Compute instance

1. In OCI, create a **Compute** instance. **Ubuntu** is a good default for this stack; Oracle Linux works too if you prefer it.
2. **Shape (example):** **1 OCPU with 6 GB RAM** (e.g. Ampere A1 Flex or a small x86 VM) is **comfortable** for Express + the Discord bot + Lavalink (Java) on one machine. The bare minimum is tighter (~1 GB RAM can work for Node alone, but Lavalink needs headroom—**4 GB+** is safer if you add more services).
3. **Networking:** assign a **public IP** if you need SSH and outbound Discord/Lavalink; keep **ingress** locked down (SSH from your IP only).
4. **Outbound:** allow HTTPS to Discord, YouTube/CDN hosts, and MongoDB Atlas (HTTPS).
5. On **Ubuntu**, install **Node.js 20+** ([NodeSource](https://github.com/nodesource/distributions) or [Node’s official binary](https://nodejs.org/en/download)) and **Git** (`sudo apt update && sudo apt install -y git`). SSH user is usually **`ubuntu`** (not `opc`, which is typical on Oracle Linux images).

### 2.2 Java + Lavalink (same VM as bot)

1. Install **JDK 17+** (Temurin is fine).
2. On the VM, clone this repo (e.g. `/opt/music-bot`) and run **`npm install`** from the **repo root** (workspaces).
3. Download **`Lavalink.jar`** into `services/lavalink/` (see root README).
4. Edit **`services/lavalink/application.yml`**:
   - Set **`server.address: 0.0.0.0`** if anything other than localhost must reach Lavalink (usually **not** needed if bot and Lavalink are the same machine; use `127.0.0.1` for localhost-only).
   - Match **`LAVALINK_PASSWORD`** and port with the bot’s `.env`.
5. Run Lavalink under **systemd** or **PM2** (separate process from Node). Example systemd unit (paths adjusted):

```ini
[Unit]
Description=Lavalink
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/music-bot/services/lavalink
ExecStart=/usr/bin/java -jar /opt/music-bot/services/lavalink/Lavalink.jar
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### 2.3 Environment file on the VM

Create **`/opt/music-bot/.env`** (repo root; both API and bot load this file).

**MongoDB in production — set this variable here only**

| Variable | Where | Required? |
|----------|--------|-------------|
| **`MONGO_URI`** | **Oracle VM:** root `.env` (e.g. `/opt/music-bot/.env`) | **Yes** for playlists, auth-linked DB features, and anything using `@music-bot/db` on the API. Same value for bot if you use **`/playlist`** in Discord. |
| **`MONGO_URI`** | **Vercel:** do **not** set | Next.js does not connect to Mongo; the browser calls your API, and the API uses `MONGO_URI` on the server. |

After editing `.env`, restart processes (`pm2 reload all` or your deploy workflow).

Other keys in the same VM **`.env`**:

- **`DISCORD_TOKEN`**, **`LAVALINK_*`**, **`DISCORD_GUILD_ID`** (optional).
- **API:** `API_PORT`, **`WEB_ORIGIN`** (your **Vercel** URL, no trailing slash), **`DISCORD_REDIRECT_URI`** = `{WEB_ORIGIN}/auth/discord/callback`, `CLIENT_ID`, `CLIENT_SECRET`, **`SESSION_SECRET`**, `ADMIN_IDS`, optional `BOT_INTERNAL_KEY`.
- **`NODE_ENV=production`** for both API and bot processes.

**CORS:** `WEB_ORIGIN` on the API must **exactly** match the browser origin of the Vercel deployment (scheme + host, no path).

### 2.4 Reverse proxy (optional but typical)

- If the API is **only** reached by Vercel’s server-side rewrites, you can bind Express to `127.0.0.1` and not expose `API_PORT` publicly.
- If you need a **public API URL** (e.g. health checks), put **nginx** or **Caddy** in front with TLS and proxy to `http://127.0.0.1:3001`.

### 2.5 Process manager (PM2)

Use the repo’s **[`deploy/ecosystem.config.cjs`](../deploy/ecosystem.config.cjs)** after editing the `cwd` root if yours is not `/opt/music-bot`:

```bash
cd /opt/music-bot
npm ci --omit=dev
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed command so PM2 survives reboot
```

---

## 3. Vercel (Next.js frontend)

### 3.1 Connect the repo

1. Import the GitHub repository in [Vercel](https://vercel.com).
2. **Root Directory:** `apps/web`.
3. **Production Branch:** set to **`production`** (or rename in Git settings to match your workflow file).
4. **Framework preset:** Next.js (auto).

### 3.2 Build settings (monorepo)

The repo includes **[`apps/web/vercel.json`](../apps/web/vercel.json)** so installs and builds run from the **monorepo root** (`npm ci` + `npm run build -w @music-bot/web`). If the dashboard overrides them, align with that file.

### 3.3 Environment variables (Vercel project → Settings → Environment Variables)

Set for **Production** (and Preview if you use previews):

| Variable | Example | Purpose |
|----------|---------|---------|
| **`WEB_ORIGIN`** | `https://your-app.vercel.app` | Must match API `WEB_ORIGIN` and Discord OAuth redirect host. |
| **`API_INTERNAL_URL`** | `https://api.yourdomain.com` or `http://10.0.0.5:3001` | Base URL the **Next server** uses for rewrites to Express (see `apps/web/next.config.mjs`). Must be reachable from Vercel’s build/runtime (not `localhost` unless you use a tunnel). |
| **`CLIENT_ID`** | Discord application ID | Injected for `/add-bot` and `NEXT_PUBLIC_DISCORD_CLIENT_ID`. |
| **`NEXT_PUBLIC_API_URL`** | Same as `API_INTERNAL_URL` if no separate public URL | Fallback when `API_INTERNAL_URL` is unset. |

**Discord Developer Portal:** OAuth2 redirect must be **`{WEB_ORIGIN}/auth/discord/callback`** (production URL).

### 3.4 Connecting Vercel to a private API

If the API has **no public URL**, use **Vercel Secure Compute / private networking**, a **VPN/tunnel** to OCI, or expose the API behind HTTPS with IP allowlisting for Vercel’s egress (fragile). Most teams use a **small public API** behind TLS + auth for session routes only.

---

## 4. CI/CD from the `production` branch

### 4.1 Vercel (automatic)

With the GitHub integration, **every push to `production`** triggers a production deployment of `apps/web`. No extra workflow file is required for the frontend.

Use **Preview deployments** from pull requests for staging.

### 4.2 Oracle VM (GitHub Actions)

The workflow **[`.github/workflows/deploy-oci-production.yml`](../.github/workflows/deploy-oci-production.yml)** runs on **`push` to `production`** and SSHs into your instance to `git pull`, `npm ci`, and `pm2 reload`.

**One-time server setup**

1. `sudo useradd -m deploy` (or use `opc`) and install your SSH public key in `~/.ssh/authorized_keys`.
2. Clone the repo once:

   ```bash
   sudo mkdir -p /opt/music-bot
   sudo chown $USER:$USER /opt/music-bot
   git clone https://github.com/YOUR_ORG/dj-ramu-kaka-discord-bot.git /opt/music-bot
   cd /opt/music-bot && git checkout production
   ```

3. Copy **`.env`** onto the server (never commit `.env`).
4. Install PM2 globally: `npm install -g pm2` and run `pm2 start deploy/ecosystem.config.cjs` once.

**GitHub repository secrets** (Settings → Secrets and variables → Actions)

| Secret | Description |
|--------|-------------|
| **`OCI_SSH_HOST`** | Public IP or hostname of the compute instance. |
| **`OCI_SSH_USER`** | SSH user (e.g. `opc` on Oracle Linux). |
| **`OCI_SSH_KEY`** | **Private** key (full PEM, including `BEGIN`/`END` lines) matching the public key on the server. |
| **`OCI_APP_PATH`** | Absolute path to the clone (e.g. `/opt/music-bot`). |

**Optional:** restrict the workflow with `paths:` so pushes that only touch `apps/web/` do not redeploy OCI (edit the YAML).

### 4.3 Branch strategy

- Default development on **`main`** (or `master`).
- Merge or fast-forward into **`production`** when you want a release; that triggers OCI deploy (and Vercel production if the branch is `production`).

---

## 5. Pre-flight checklist

- [ ] Atlas **Network Access** allows the **Oracle** instance (or locked-down alternative you chose).
- [ ] **`MONGO_URI`** on the VM matches Atlas user + DB name.
- [ ] **`WEB_ORIGIN`** identical on **Vercel**, **API `.env`**, and **Discord redirect URI**.
- [ ] **`API_INTERNAL_URL`** on Vercel is a URL the Next.js **server** can open (test with `curl` from your laptop to that URL).
- [ ] **`SESSION_SECRET`** set on API in production.
- [ ] Lavalink **Java 17+**, **`Lavalink.jar`**, password matches **`LAVALINK_PASSWORD`**.
- [ ] Bot **`LAVALINK_HOST`** is `127.0.0.1` if Lavalink is local on the same VM.
- [ ] Slash commands: **`npm run register-commands -w @music-bot/bot`** after token or command changes (can be added to the deploy script).

---

## 6. Troubleshooting

| Symptom | Check |
|---------|--------|
| OAuth redirect mismatch | Portal redirect URL, `DISCORD_REDIRECT_URI`, and `WEB_ORIGIN` must agree. |
| CORS errors | API `WEB_ORIGIN` must be the Vercel origin only. |
| 502 on `/auth/*` from Vercel | `API_INTERNAL_URL` wrong, API down, or firewall blocking Vercel → API. |
| Bot connects, no audio | Lavalink running, `LAVALINK_*` env, Java 17+, `application.yml` plugins. |
| Playlists 401 / no session | Cookie `Secure` + HTTPS on Vercel; same-site rules (see README). |

For architecture rules (keep web / API / bot separate), see **[init.md](../init.md)**.
