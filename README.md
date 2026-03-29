# DJ Ramu Kaka — music bot system

Monorepo: **Next.js** (`apps/web`), **Express** (`apps/api`), **Discord bot** (`apps/bot`), plus **Lavalink** (Java). See [`init.md`](./init.md) for architecture rules (three apps must stay separate).

## Quick start

1. Copy `.env.example` → `.env` and fill values ([external setup](#what-you-need-externally)).
2. Install: `npm install` (repo root).
3. Start MongoDB locally or use Atlas.
4. Start Lavalink: from `services/lavalink`, run `java -jar ../../Lavalink.jar` (Java 17+).
5. In separate terminals (or `npm run dev` for all Node apps):

   - `npm run dev:api`
   - `npm run dev:bot`
   - `npm run dev:web`

## GSD / planning

- Project context: [`.planning/PROJECT.md`](./.planning/PROJECT.md)
- Roadmap: [`.planning/ROADMAP.md`](./.planning/ROADMAP.md)
- Requirements: [`.planning/REQUIREMENTS.md`](./.planning/REQUIREMENTS.md)

Next step in the GSD workflow: **`/gsd-discuss-phase 1`** or **`/gsd-plan-phase 1`**.

## What you need externally

See **“What you need externally”** in the assistant’s summary or expand your deployment checklist from `.env.example` and `init.md`.
