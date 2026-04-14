/**
 * Safe interaction utilities to prevent "Interaction has already been acknowledged" errors.
 */

const { MessageFlags } = require('discord.js');
const { TIME_SYNC_INLINE } = require('./time-sync-hint');

/**
 * TEMP: log ack state for interaction timing bugs. Set BOT_INTERACTION_DEBUG=1 in `.env`.
 * @param {import('discord.js').BaseInteraction} interaction
 * @param {string} label
 */
function logInteractionAckState(interaction, label) {
  if (process.env.BOT_INTERACTION_DEBUG !== '1') return;
  console.log({
    where: label,
    type: interaction.type,
    deferred: interaction.deferred,
    replied: interaction.replied,
    age: Date.now() - interaction.createdTimestamp,
  });
}

/**
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {import('discord.js').InteractionReplyOptions | string} options
 */
async function safeReply(interaction, options) {
  try {
    if (interaction.replied) {
      // If already replied, we can only followUp.
      // Note: followUp on a deferred interaction that hasn't been replied to yet
      // will also work, but checked below for clarity.
      return await interaction.followUp(options);
    }

    if (interaction.deferred) {
      // If deferred but not replied, we must use editReply.
      // String options are converted to { content: options }.
      const payload = typeof options === 'string' ? { content: options } : options;
      return await interaction.editReply(payload);
    }

    // Normal reply
    return await interaction.reply(options);
  } catch (err) {
    // Only log if it's not the exact error we're trying to avoid (to avoid log spam)
    if (err.code !== 40060) {
      console.error('[safeReply] Unexpected error:', err);
    }
  }
}

/**
 * @typedef {{ likelyClockSkew?: boolean }} InteractionTimingHint
 * When gateway packet is fresh but snowflake age is huge, local PC clock is likely ahead of UTC — do not trust `Date.now()-createdTimestamp`.
 */

/**
 * Safe deferUpdate for component interactions.
 * @param {import('discord.js').MessageComponentInteraction} interaction
 * @param {InteractionTimingHint} [timing]
 * @returns {Promise<boolean>} True if successful
 */
async function safeDeferUpdate(interaction, timing) {
  try {
    if (interaction.deferred || interaction.replied) return true;
    const age =
      typeof interaction.createdTimestamp === 'number'
        ? Date.now() - interaction.createdTimestamp
        : 0;
    if (age > 2500 && !timing?.likelyClockSkew) {
      console.warn('[safeDeferUpdate] Interaction old before defer (may 10062):', age, 'ms');
    }
    await interaction.deferUpdate();
    return true;
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined;
    const label =
      code === 10062
        ? 'Unknown interaction (expired or invalid token)'
        : code === 40060
          ? 'Already acknowledged'
          : 'error';
    const ageMs =
      typeof interaction.createdTimestamp === 'number'
        ? Date.now() - interaction.createdTimestamp
        : -1;
    const idHint = interaction?.id ? ` id=${interaction.id}` : '';
    let ageHint = code === 10062 ? ` interactionAge=${ageMs}ms${idHint}` : '';
    if (code === 10062 && timing?.likelyClockSkew) {
      ageHint += ` | If gateway was fresh, ${TIME_SYNC_INLINE}`;
    } else if (code === 10062 && ageMs >= 0 && ageMs < 4000) {
      ageHint +=
        ' | If age is low but this persists, stop duplicate bot processes (same DISCORD_TOKEN) or fix OS clock vs NTP.';
    }
    if (code !== 40060 && code !== 10062) {
      console.error('[safeDeferUpdate]', label, err);
    } else if (code === 40060) {
      console.warn(
        '[safeDeferUpdate]',
        `Already acknowledged — duplicate INTERACTION_CREATE or token already used; this copy skipped.${idHint}`,
      );
    } else {
      console.warn('[safeDeferUpdate]', label, err?.message || err, ageHint);
    }
    return false;
  }
}

/**
 * Safe deferReply to prevent expiration or double-acknowledgement.
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {import('discord.js').InteractionDeferReplyOptions} [options]
 * @param {InteractionTimingHint} [timing]
 * @returns {Promise<boolean>} True if successful
 */
async function safeDeferReply(interaction, options, timing) {
  try {
    if (interaction.deferred || interaction.replied) return true;
    const age =
      typeof interaction.createdTimestamp === 'number'
        ? Date.now() - interaction.createdTimestamp
        : 0;
    if (age > 2500 && !timing?.likelyClockSkew) {
      console.warn('[safeDeferReply] Interaction old before defer (may 10062):', age, 'ms');
    }
    await interaction.deferReply(options);
    return true;
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined;
    const label =
      code === 10062
        ? 'Unknown interaction (usually >3s before first ack, or invalid token)'
        : code === 40060
          ? 'Already acknowledged'
          : 'error';
    const ageMs =
      typeof interaction.createdTimestamp === 'number'
        ? Date.now() - interaction.createdTimestamp
        : -1;
    const idHint = interaction?.id ? ` id=${interaction.id}` : '';
    const cmdHint =
      typeof interaction.isChatInputCommand === 'function' && interaction.isChatInputCommand()
        ? ` cmd=/${interaction.commandName}`
        : '';
    let ageHint = code === 10062 ? ` interactionAge=${ageMs}ms${idHint}${cmdHint}` : '';
    if (code === 10062 && timing?.likelyClockSkew) {
      ageHint += ` | ${TIME_SYNC_INLINE}`;
    } else if (code === 10062 && ageMs >= 0 && ageMs < 4000) {
      ageHint +=
        ' | Often: a second bot instance (same token) acked first, or system clock skew vs UTC.';
    }
    if (code !== 40060 && code !== 10062) {
      console.error('[safeDeferReply]', label, err);
    } else if (code === 40060) {
      console.warn(
        '[safeDeferReply]',
        `Already acknowledged — duplicate INTERACTION_CREATE or token already used; this copy skipped.${idHint}${cmdHint}`,
      );
    } else {
      console.warn('[safeDeferReply]', label, err?.message || err, ageHint);
    }
    return false;
  }
}

/**
 * Ephemeral user feedback after deferReply/deferUpdate (editReply is wrong for many component acks).
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {string} content
 */
async function safeEphemeralReply(interaction, content) {
  const options = { content, flags: MessageFlags.Ephemeral };
  if (interaction.deferred) {
    return interaction.followUp(options);
  }
  return safeReply(interaction, options);
}

module.exports = {
  safeReply,
  safeDeferUpdate,
  safeDeferReply,
  safeEphemeralReply,
  logInteractionAckState,
};
