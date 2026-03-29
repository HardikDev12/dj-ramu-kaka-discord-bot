const { LoadType } = require('shoukaku');

/** @typedef {{ encoded: string, title: string }} QueuedTrack */

/** @type {Map<string, QueuedTrack[]>} */
const queues = new Map();

/** @type {Set<string>} */
const endListenerAttached = new Set();

/**
 * @param {import('shoukaku').Player} player
 * @param {string} guildId
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
function attachQueueAdvance(player, guildId, shoukaku) {
  if (endListenerAttached.has(guildId)) return;
  endListenerAttached.add(guildId);
  player.on('end', async (ev) => {
    if (ev.reason === 'replaced') return;
    if (ev.reason === 'stopped' || ev.reason === 'cleanup') return;
    const q = queues.get(guildId) || [];
    const next = q.shift();
    queues.set(guildId, q);
    if (!next) return;
    try {
      const p = shoukaku.players.get(guildId);
      if (p) await p.playTrack({ track: { encoded: next.encoded } });
    } catch (e) {
      console.error('[queue advance]', e);
    }
  });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function ensureVoice(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: 'Use this in a server.', ephemeral: true });
    return null;
  }
  const channel = interaction.member?.voice?.channel;
  if (!channel) {
    await interaction.reply({ content: 'Join a voice channel first.', ephemeral: true });
    return null;
  }
  const node = shoukaku.getIdealNode();
  if (!node) {
    await interaction.reply({
      content: 'Lavalink is not connected. Start it: `cd services/lavalink && java -jar Lavalink.jar`',
      ephemeral: true,
    });
    return null;
  }
  return { guildId, channelId: channel.id };
}

/**
 * @param {import('shoukaku').LavalinkResponse | undefined} res
 * @returns {{ encoded: string, title: string } | null}
 */
function firstTrackFromResolve(res) {
  if (!res) return null;
  if (res.loadType === LoadType.ERROR) {
    throw new Error(res.data?.message || 'Lavalink error');
  }
  if (res.loadType === LoadType.EMPTY) return null;
  if (res.loadType === LoadType.TRACK) {
    const t = res.data;
    return { encoded: t.encoded, title: t.info.title };
  }
  if (res.loadType === LoadType.SEARCH) {
    const t = res.data[0];
    if (!t) return null;
    return { encoded: t.encoded, title: t.info.title };
  }
  if (res.loadType === LoadType.PLAYLIST) {
    const t = res.data.tracks[0];
    if (!t) return null;
    return { encoded: t.encoded, title: t.info.title };
  }
  return null;
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handlePlay(interaction, shoukaku) {
  const voice = await ensureVoice(interaction);
  if (!voice) return;

  const query = interaction.options.getString('query', true);
  await interaction.deferReply();

  try {
    let player = shoukaku.players.get(voice.guildId);
    if (!player) {
      player = await shoukaku.joinVoiceChannel({
        guildId: voice.guildId,
        channelId: voice.channelId,
        shardId: 0,
      });
      attachQueueAdvance(player, voice.guildId, shoukaku);
    }

    const res = await player.node.rest.resolve(query);
    const track = firstTrackFromResolve(res);
    if (!track) {
      await interaction.editReply('No results for that query. Try a URL or `scsearch:something` (YouTube is off in default Lavalink config).');
      return;
    }

    const playing = Boolean(player.track);
    if (playing) {
      const q = queues.get(voice.guildId) || [];
      q.push(track);
      queues.set(voice.guildId, q);
      await interaction.editReply(`Added to queue: **${track.title}** (position ${q.length})`);
      return;
    }

    await player.playTrack({ track: { encoded: track.encoded } });
    await interaction.editReply(`Now playing: **${track.title}**`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply(`Failed: ${msg}`);
  }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handleStop(interaction, shoukaku) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: 'Use this in a server.', ephemeral: true });
    return;
  }
  queues.delete(guildId);
  const player = shoukaku.players.get(guildId);
  if (player) {
    await player.stopTrack().catch(() => {});
    await shoukaku.leaveVoiceChannel(guildId).catch(() => {});
  }
  endListenerAttached.delete(guildId);
  await interaction.reply({ content: 'Stopped and left voice.', ephemeral: true });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handlePause(interaction, shoukaku) {
  const guildId = interaction.guildId;
  const player = guildId && shoukaku.players.get(guildId);
  if (!player?.track) {
    await interaction.reply({ content: 'Nothing is playing.', ephemeral: true });
    return;
  }
  await player.setPaused(true);
  await interaction.reply({ content: 'Paused.', ephemeral: true });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handleResume(interaction, shoukaku) {
  const guildId = interaction.guildId;
  const player = guildId && shoukaku.players.get(guildId);
  if (!player) {
    await interaction.reply({ content: 'Not in voice.', ephemeral: true });
    return;
  }
  await player.setPaused(false);
  await interaction.reply({ content: 'Resumed.', ephemeral: true });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handleSkip(interaction, shoukaku) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const player = shoukaku.players.get(guildId);
  const q = queues.get(guildId) || [];
  if (!player && q.length === 0) {
    await interaction.reply({ content: 'Nothing to skip.', ephemeral: true });
    return;
  }
  const next = q.shift();
  queues.set(guildId, q);
  if (player && next) {
    await player.playTrack({ track: { encoded: next.encoded } });
    await interaction.reply({ content: `Skipped. Now: **${next.title}**` });
    return;
  }
  if (player) {
    await player.stopTrack().catch(() => {});
    await shoukaku.leaveVoiceChannel(guildId).catch(() => {});
  }
  await interaction.reply({ content: 'Queue empty — stopped.', ephemeral: true });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handleQueue(interaction, shoukaku) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const q = queues.get(guildId) || [];
  const player = shoukaku.players.get(guildId);
  const lines = [];
  if (player?.track && player.node) {
    try {
      const decoded = await player.node.rest.decode(player.track);
      if (decoded?.info?.title) lines.push(`**Now:** ${decoded.info.title}`);
    } catch {
      lines.push('**Now:** (playing)');
    }
  }
  if (q.length === 0 && lines.length === 0) {
    await interaction.reply({ content: 'Queue is empty.', ephemeral: true });
    return;
  }
  q.forEach((t, i) => lines.push(`${i + 1}. ${t.title}`));
  await interaction.reply({ content: lines.join('\n').slice(0, 1900), ephemeral: true });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handleNowPlaying(interaction, shoukaku) {
  const guildId = interaction.guildId;
  const player = guildId && shoukaku.players.get(guildId);
  if (!player?.track) {
    await interaction.reply({ content: 'Nothing playing.', ephemeral: true });
    return;
  }
  try {
    const decoded = await player.node.rest.decode(player.track);
    const title = decoded?.info?.title || 'Unknown';
    const paused = player.paused ? ' (paused)' : '';
    await interaction.reply({ content: `**Now playing:** ${title}${paused}`, ephemeral: true });
  } catch {
    await interaction.reply({ content: 'Something is playing (could not decode title).', ephemeral: true });
  }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handleMusicCommand(interaction, shoukaku) {
  switch (interaction.commandName) {
    case 'play':
      return handlePlay(interaction, shoukaku);
    case 'stop':
      return handleStop(interaction, shoukaku);
    case 'pause':
      return handlePause(interaction, shoukaku);
    case 'resume':
      return handleResume(interaction, shoukaku);
    case 'skip':
      return handleSkip(interaction, shoukaku);
    case 'queue':
      return handleQueue(interaction, shoukaku);
    case 'nowplaying':
      return handleNowPlaying(interaction, shoukaku);
    default:
      return interaction.reply({ content: 'Unknown command.', ephemeral: true });
  }
}

module.exports = { handleMusicCommand };
