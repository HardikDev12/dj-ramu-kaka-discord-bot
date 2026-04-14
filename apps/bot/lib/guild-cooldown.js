/**
 * Per-guild rate limits so one server cannot spam Lavalink / voice ops and starve others.
 * Cooldowns are isolated per guild: 5–6 (or more) servers can run concurrently without sharing a bucket.
 *
 * Tuning: if Lavalink or CPU struggles with many guilds, raise BOT_GUILD_COOLDOWN_HEAVY_MS (play / resolve).
 */

const LIGHT_MS = Math.max(
  0,
  Number.parseInt(process.env.BOT_GUILD_COOLDOWN_LIGHT_MS ?? "700", 10) || 700,
);
const HEAVY_MS = Math.max(
  0,
  Number.parseInt(process.env.BOT_GUILD_COOLDOWN_HEAVY_MS ?? "2500", 10) || 2500,
);

/** @type {Map<string, number>} */
const lastLight = new Map();
/** @type {Map<string, number>} */
const lastHeavy = new Map();

const PRUNE_EVERY_MS = 5 * 60 * 1000;
const STALE_AFTER_MS = Math.max(LIGHT_MS, HEAVY_MS) * 20;

function pruneMap(map) {
  const now = Date.now();
  const cutoff = now - STALE_AFTER_MS;
  for (const [id, ts] of map.entries()) {
    if (ts < cutoff) map.delete(id);
  }
}

setInterval(() => {
  pruneMap(lastLight);
  pruneMap(lastHeavy);
}, PRUNE_EVERY_MS);

/**
 * @param {import('discord.js').BaseInteraction} interaction
 * @returns {'light' | 'heavy' | null}
 */
function tierFromChatCommand(interaction) {
  if (!interaction.isChatInputCommand()) return null;
  if (interaction.commandName === "playlist") {
    const sub = interaction.options.getSubcommand(false);
    return sub === "add" || sub === "load" ? "heavy" : null;
  }
  const name = interaction.commandName;
  if (name === "help" || name === "queue" || name === "nowplaying") return null;
  if (name === "play") return "heavy";
  if (name === "pause" || name === "resume" || name === "skip" || name === "stop")
    return "light";
  return null;
}

/**
 * @param {import('discord.js').BaseInteraction} interaction
 * @returns {'light' | 'heavy' | null}
 */
function guildInteractionCooldownTier(interaction) {
  if (!interaction.inGuild() || !interaction.guildId) return null;
  if (interaction.isAutocomplete()) return null;

  if (interaction.isButton()) {
    if (!interaction.customId.startsWith("djrk:")) return null;
    return interaction.customId.includes(":queue") ? null : "light";
  }

  if (interaction.isStringSelectMenu()) {
    const id = interaction.customId;
    if (id.startsWith("djrkpick:") || id.startsWith("djrkplpick:")) return "light";
    return null;
  }

  return tierFromChatCommand(interaction);
}

/**
 * @param {string} guildId
 * @param {'light' | 'heavy'} tier
 * @returns {{ ok: true } | { ok: false; retryAfterSec: number }}
 */
function tryConsumeGuildCooldown(guildId, tier) {
  const ms = tier === "heavy" ? HEAVY_MS : LIGHT_MS;
  if (ms <= 0) return { ok: true };

  const map = tier === "heavy" ? lastHeavy : lastLight;
  const now = Date.now();
  const prev = map.get(guildId) ?? 0;
  const elapsed = now - prev;
  if (elapsed < ms) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((ms - elapsed) / 1000)),
    };
  }
  map.set(guildId, now);
  return { ok: true };
}

module.exports = {
  guildInteractionCooldownTier,
  tryConsumeGuildCooldown,
  LIGHT_MS,
  HEAVY_MS,
};
