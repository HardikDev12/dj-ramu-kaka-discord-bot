import { loadEnv } from "@djramu/config";

const env = loadEnv();
console.log(
  "[@djramu/bot] scaffold — Lavalink target %s:%s (Phase 3: discord.js + player)",
  env.LAVALINK_HOST,
  env.LAVALINK_PORT,
);
