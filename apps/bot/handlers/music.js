const { randomBytes } = require('crypto');
const {
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const { LoadType } = require('shoukaku');
const {
  lavalinkResolveQuery,
  loadSearchTracks,
  lavalinkResponseFromTrackList,
  resolvePlayableEncoded,
  firstTrackFromResolve,
  tracksFromSearchResults,
  urlToQueuedTrack,
} = require('../lib/lavalink-query');

/** @typedef {{ encoded: string; title: string; author?: string; uri?: string }} QueuedTrack */

/** @type {Map<string, QueuedTrack[]>} */
const queues = new Map();

/** @type {Set<string>} */
const endListenerAttached = new Set();

/** Now-playing message per guild (Hydra-style panel). */
/** @type {Map<string, { channelId: string, messageId: string }>} */
const playerPanels = new Map();

const BTN = 'djrk';
const PICK_PREFIX = 'djrkpick';
const PICK_TTL_MS = 10 * 60 * 1000;
const MAX_PICK_OPTIONS = 25;

/** Pending search picks: nonce → who searched + track list (option values are indices only). */
/** @type {Map<string, { userId: string; guildId: string; tracks: QueuedTrack[]; created: number }>} */
const pickSessions = new Map();

function truncate(str, max) {
  const s = String(str ?? '');
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function takePickSession(nonce) {
  const row = pickSessions.get(nonce);
  if (!row) return null;
  if (Date.now() - row.created > PICK_TTL_MS) {
    pickSessions.delete(nonce);
    return null;
  }
  return row;
}

/**
 * Voice channel the bot is using in this guild — prefer live Discord state, fall back to Shoukaku
 * (fixes false "join same VC" when `members.me.voice` lags or desyncs after moves / concurrent play).
 * @param {import('discord.js').Guild | null} guild
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {string | null} guildId
 */
function getBotVoiceChannelId(guild, shoukaku, guildId) {
  if (!guildId) return null;
  const fromDiscord = guild?.members?.me?.voice?.channelId ?? null;
  if (fromDiscord) return fromDiscord;
  const conn = shoukaku.connections.get(guildId);
  return conn?.channelId ?? null;
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
function inSameVoiceAsBot(interaction, shoukaku) {
  const guild = interaction.guild;
  const guildId = interaction.guildId;
  const botVc = getBotVoiceChannelId(guild, shoukaku, guildId);
  const userVc = interaction.member && 'voice' in interaction.member ? interaction.member.voice?.channelId : null;
  return Boolean(botVc && userVc && botVc === userVc);
}

/**
 * If already connected in this guild, move the bot to the requester's channel (Discord OP 4).
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {string} guildId
 * @param {string} channelId
 * @returns {boolean} true if a move was sent
 */
function tryMoveBotToChannel(shoukaku, guildId, channelId) {
  const conn = shoukaku.connections.get(guildId);
  if (!conn || !channelId) return false;
  if (conn.channelId === channelId) return false;
  conn.lastChannelId = conn.channelId;
  conn.channelId = channelId;
  conn.sendVoiceUpdate();
  return true;
}

/**
 * @param {string} customId
 * @returns {{ guildId: string; action: string } | null}
 */
function parseButtonId(customId) {
  const parts = customId.split(':');
  if (parts.length !== 3 || parts[0] !== BTN) return null;
  return { guildId: parts[1], action: parts[2] };
}

/**
 * @param {string} guildId
 * @param {import('shoukaku').Player | undefined} player
 */
function createPlayerRows(guildId, player) {
  const q = queues.get(guildId) || [];
  const hasTrack = Boolean(player?.track);
  const paused = Boolean(player?.paused);
  const canSkip = hasTrack || q.length > 0;
  const inSession = Boolean(player);

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${BTN}:${guildId}:pause`)
        .setLabel('Pause')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏸️')
        .setDisabled(!hasTrack || paused),
      new ButtonBuilder()
        .setCustomId(`${BTN}:${guildId}:resume`)
        .setLabel('Resume')
        .setStyle(ButtonStyle.Success)
        .setEmoji('▶️')
        .setDisabled(!hasTrack || !paused),
      new ButtonBuilder()
        .setCustomId(`${BTN}:${guildId}:skip`)
        .setLabel('Skip')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⏭️')
        .setDisabled(!canSkip),
      new ButtonBuilder()
        .setCustomId(`${BTN}:${guildId}:stop`)
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⏹️')
        .setDisabled(!inSession),
      new ButtonBuilder()
        .setCustomId(`${BTN}:${guildId}:queue`)
        .setLabel('Queue')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📜')
    ),
  ];
}

/**
 * @param {string} guildId
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function buildPanelPayload(guildId, shoukaku) {
  const player = shoukaku.players.get(guildId);
  const q = queues.get(guildId) || [];
  let title = 'Nothing playing';
  if (player?.track) {
    try {
      const decoded = await player.node.rest.decode(player.track);
      title = decoded?.info?.title || title;
    } catch {
      title = 'Playing';
    }
  }
  const playing = Boolean(player?.track);
  let panelColor = 0x99aab5;
  if (playing) panelColor = player?.paused ? 0xfee75c : 0x57f287;
  const embed = new EmbedBuilder()
    .setColor(panelColor)
    .setTitle(playing ? '🎵 Now playing' : '🔇 Player idle')
    .setDescription(playing ? `**${truncate(title, 250)}**` : '*Join voice and use `/play` to start.*')
    .addFields({
      name: '📋 Queue',
      value: q.length ? `${q.length} track(s) waiting` : 'Empty',
      inline: false,
    });
  if (playing && player?.paused) embed.setFooter({ text: 'Paused — use Resume to continue' });
  const components = player ? createPlayerRows(guildId, player) : [];
  return { embeds: [embed], components, content: null };
}

/**
 * @param {import('discord.js').Client} client
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function refreshPlayerPanel(guildId, client, shoukaku) {
  const ref = playerPanels.get(guildId);
  if (!ref) return;
  const channel = await client.channels.fetch(ref.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const msg = await channel.messages.fetch(ref.messageId).catch(() => null);
  if (!msg) return;
  const payload = await buildPanelPayload(guildId, shoukaku);
  await msg.edit(payload).catch(() => {});
}

/**
 * @param {import('discord.js').Client} client
 */
async function clearPlayerPanel(guildId, client, finalContent) {
  const ref = playerPanels.get(guildId);
  playerPanels.delete(guildId);
  if (!ref) return;
  const channel = await client.channels.fetch(ref.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const msg = await channel.messages.fetch(ref.messageId).catch(() => null);
  if (!msg) return;
  await msg.edit({ content: finalContent, embeds: [], components: [] }).catch(() => {});
}

/**
 * @param {import('shoukaku').Player} player
 * @param {string} guildId
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
function attachQueueAdvance(player, guildId, shoukaku, client) {
  if (endListenerAttached.has(guildId)) return;
  endListenerAttached.add(guildId);
  player.on('end', async (ev) => {
    if (ev.reason === 'replaced') return;
    if (ev.reason === 'stopped' || ev.reason === 'cleanup') return;
    const q = queues.get(guildId) || [];
    const next = q.shift();
    queues.set(guildId, q);
    const p = shoukaku.players.get(guildId);
    if (next && p) {
      try {
        const playable = await resolvePlayableEncoded(p.node.rest, next);
        await p.playTrack({ track: { encoded: playable.encoded } });
      } catch (e) {
        console.error('[queue advance]', e);
      }
    }
    await refreshPlayerPanel(guildId, client, shoukaku);
  });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function ensureVoice(interaction, shoukaku) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
    return null;
  }
  const channel = interaction.member?.voice?.channel;
  if (!channel) {
    await interaction.reply({ content: 'Join a voice channel first.', flags: MessageFlags.Ephemeral });
    return null;
  }
  const node = shoukaku.getIdealNode();
  if (!node) {
    await interaction.reply({
      content:
        'No Lavalink node is connected yet. If you just ran `npm run dev`, wait until the terminal shows **Lavalink is ready to accept connections** and the bot logs **`[Lavalink] Node "main" connected`** (or **`ready`**), then try again. Lavalink needs **Java 17+**; check the `[lava]` lines if it exits immediately.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }
  return { guildId, channelId: channel.id };
}

/**
 * Load saved playlist URLs into the voice queue (and start if idle).
 * @param {{ guildId: string, channelId: string, interaction: import('discord.js').ChatInputCommandInteraction, client: import('discord.js').Client, shoukaku: import('shoukaku').Shoukaku, tracks: { url: string }[] }} args
 */
async function playPlaylistInGuild(args) {
  const { guildId, channelId, interaction, client, shoukaku, tracks } = args;
  let player = shoukaku.players.get(guildId);
  if (!player) {
    player = await shoukaku.joinVoiceChannel({
      guildId,
      channelId,
      shardId: 0,
    });
    attachQueueAdvance(player, guildId, shoukaku, client);
  } else {
    tryMoveBotToChannel(shoukaku, guildId, channelId);
  }
  const rest = player.node.rest;
  /** @type {QueuedTrack[]} */
  const ready = [];
  let skipped = 0;
  for (const t of tracks) {
    try {
      const qt = await urlToQueuedTrack(rest, t.url);
      if (qt) ready.push(qt);
      else skipped += 1;
    } catch {
      skipped += 1;
    }
  }
  if (!ready.length) {
    await interaction.editReply(
      'Could not load any tracks from that playlist (every URL failed Lavalink resolve). Check links or try `/play` on one URL.'
    );
    return;
  }
  const q = queues.get(guildId) || [];
  const playing = Boolean(player.track);
  if (playing) {
    q.push(...ready);
    queues.set(guildId, q);
    const note = skipped ? ` (${skipped} URL(s) skipped)` : '';
    await interaction.editReply(`Queued **${ready.length}** track(s) from your playlist.${note}`);
    await refreshPlayerPanel(guildId, client, shoukaku);
    return;
  }
  const [first, ...restQueued] = ready;
  queues.set(guildId, [...q, ...restQueued]);
  const playable = await resolvePlayableEncoded(rest, first);
  await player.playTrack({ track: { encoded: playable.encoded } });
  const payload = await buildPanelPayload(guildId, shoukaku);
  await interaction.editReply(payload);
  const reply = await interaction.fetchReply();
  playerPanels.set(guildId, { channelId: reply.channelId, messageId: reply.id });
  if (skipped) {
    await interaction.followUp({
      content: `${skipped} playlist URL(s) could not be resolved and were skipped.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * User-facing text when Lavalink / youtube-plugin rejects resolve or playback.
 * The generic "looking up the track" line usually means YouTube blocked the lookup (search or stream).
 */
function formatPlaybackFailure(err) {
  let raw = '';
  if (err instanceof Error && typeof err.message === 'string') raw = err.message;
  else raw = String(err ?? 'Unknown error');

  const short = raw.length > 280 ? `${raw.slice(0, 277)}…` : raw;

  if (/Rest request failed/i.test(raw)) {
    return (
      `**Lavalink request failed.**\n_${short}_\n\n` +
      `Confirm Lavalink is up, **LAVALINK_PASSWORD** matches \`application.yml\`, and check the **[lava]** terminal for stack traces.`
    );
  }

  if (
    /must find action functions|signaturecipher|cipher\.js|base\.js/i.test(raw) ||
    /something broke when playing the track/i.test(raw)
  ) {
    return (
      `**YouTube playback failed (cipher / player script).**\n_${short}_\n\n` +
      `Your **youtube-plugin** is probably **too old** for YouTube’s current player. In \`services/lavalink/application.yml\` set **dev.lavalink.youtube:youtube-plugin** to the **latest** from [Maven](https://maven.lavalink.dev/releases/dev/lavalink/youtube/youtube-plugin/), remove any old \`plugins/youtube-plugin-*.jar\`, restart Lavalink, and try again.\n` +
      `If it still fails, use **OAuth** or **poToken** — see https://github.com/lavalink-devs/youtube-source`
    );
  }

  if (
    /something went wrong while looking up/i.test(raw) ||
    /loading information for a video/i.test(raw) ||
    /not play this video/i.test(raw) ||
    /sign in to confirm|age-restricted|video unavailable/i.test(raw)
  ) {
    return (
      `**YouTube / Lavalink could not load that track.**\n_${short}_\n\n` +
      `**Try:** Paste a **full YouTube URL** (\`youtube.com/watch?v=…\` or \`youtu.be/…\`) instead of text search.\n` +
      `**Try:** \`scsearch:artist song\` for SoundCloud.\n` +
      `**Server:** The **youtube-plugin** often needs extra setup (OAuth / PoToken / IP) when searches fail — see https://github.com/lavalink-devs/youtube-source and your **[lava]** logs for the exact cause.`
    );
  }

  return (
    `**Could not play.**\n_${short}_\n\n` +
    `Try a **direct link**, \`scsearch:\`, or another query. See \`/help\`.`
  );
}

/**
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string} guildId
 * @param {QueuedTrack} track
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function finalizeTrackChoice(interaction, guildId, track, shoukaku, client) {
  const player = shoukaku.players.get(guildId);
  if (!player) {
    await interaction.message.edit({ content: 'Voice session ended — run `/play` again.', components: [] }).catch(() => {});
    return;
  }
  const playing = Boolean(player.track);
  if (playing) {
    const q = queues.get(guildId) || [];
    q.push(track);
    queues.set(guildId, q);
    await interaction.message
      .edit({
        content: `Added to queue: **${track.title}** (position ${q.length})`,
        embeds: [],
        components: [],
      })
      .catch(() => {});
    await refreshPlayerPanel(guildId, client, shoukaku);
    return;
  }
  try {
    const playable = await resolvePlayableEncoded(player.node.rest, track);
    await player.playTrack({ track: { encoded: playable.encoded } });
    const payload = await buildPanelPayload(guildId, shoukaku);
    await interaction.message.edit(payload).catch(() => {});
    playerPanels.set(guildId, {
      channelId: interaction.message.channelId,
      messageId: interaction.message.id,
    });
  } catch (err) {
    console.error('[finalizeTrackChoice]', err);
    await interaction.message
      .edit({ content: formatPlaybackFailure(err), embeds: [], components: [] })
      .catch(() => {});
  }
}

/**
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function handleMusicStringSelect(interaction, shoukaku, client) {
  const prefix = `${PICK_PREFIX}:`;
  if (!interaction.customId.startsWith(prefix)) return;
  const nonce = interaction.customId.slice(prefix.length);
  const session = takePickSession(nonce);
  if (!session) {
    await interaction.reply({ content: 'This search menu expired. Run `/play` again.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (session.guildId !== interaction.guildId || session.userId !== interaction.user.id) {
    await interaction.reply({ content: 'Only the person who ran `/play` can choose a result.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!inSameVoiceAsBot(interaction, shoukaku)) {
    await interaction.reply({
      content:
        'Join the **same voice channel** as the bot. If you already are, wait a second and try again — or run `/play` again from your channel.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const idx = parseInt(interaction.values[0], 10);
  const track = session.tracks[idx];
  if (!track || Number.isNaN(idx)) {
    pickSessions.delete(nonce);
    await interaction.reply({ content: 'Invalid choice.', flags: MessageFlags.Ephemeral });
    return;
  }
  pickSessions.delete(nonce);
  await interaction.deferUpdate();
  await finalizeTrackChoice(interaction, session.guildId, track, shoukaku, client);
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function handlePlay(interaction, shoukaku, client) {
  const voice = await ensureVoice(interaction, shoukaku);
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
      attachQueueAdvance(player, voice.guildId, shoukaku, client);
    } else {
      tryMoveBotToChannel(shoukaku, voice.guildId, voice.channelId);
    }

    const resolvedQuery = lavalinkResolveQuery(query);
    const isDirectUrl = /^https?:\/\//i.test(query.trim());
    let res;
    if (!isDirectUrl) {
      const fromSearch = await loadSearchTracks(player.node.rest, resolvedQuery);
      if (fromSearch?.length) {
        res = lavalinkResponseFromTrackList(fromSearch);
      }
    }
    if (!res) {
      res = await player.node.rest.resolve(resolvedQuery);
    }
    if (res?.loadType === LoadType.ERROR) {
      throw new Error(res.data?.message || 'Lavalink error');
    }
    if (res?.loadType === LoadType.EMPTY) {
      await interaction.editReply(
        'No results for that search. Try a **direct URL**, a more specific query, or a prefix like `ytsearch:` / `scsearch:` depending on your Lavalink sources.'
      );
      return;
    }

    if (res.loadType === LoadType.SEARCH && res.data.length >= 2) {
      const tracks = tracksFromSearchResults(res);
      if (!tracks?.length) {
        await interaction.editReply('No results for that search.');
        return;
      }
      const slice = tracks.slice(0, MAX_PICK_OPTIONS);
      const nonce = randomBytes(16).toString('hex');
      pickSessions.set(nonce, {
        userId: interaction.user.id,
        guildId: voice.guildId,
        tracks: slice,
        created: Date.now(),
      });

      const options = slice.map((t, i) => {
        const num = `${i + 1}. `;
        const label = truncate(`${num}${t.title}`, 100);
        const opt = new StringSelectMenuOptionBuilder().setLabel(label).setValue(String(i));
        const desc = truncate(t.author, 100);
        if (desc) opt.setDescription(desc);
        return opt;
      });

      const select = new StringSelectMenuBuilder()
        .setCustomId(`${PICK_PREFIX}:${nonce}`)
        .setPlaceholder('Select a track…')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(select);
      const pickEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Pick a track')
        .setDescription(
          `Results for **${truncate(query, 220)}**\n\n` +
            `**${slice.length}** match${slice.length === 1 ? '' : 'es'} — use the menu below. ` +
            'Only **you** can confirm.'
        )
        .setFooter({ text: 'Menu expires after 10 minutes' });
      await interaction.editReply({
        embeds: [pickEmbed],
        content: null,
        components: [row],
      });
      return;
    }

    const track = firstTrackFromResolve(res);
    if (!track) {
      await interaction.editReply(
        'No results for that search. Try a **direct URL**, a more specific query, or a prefix like `ytsearch:` / `scsearch:` depending on your Lavalink sources.'
      );
      return;
    }

    const playing = Boolean(player.track);
    if (playing) {
      const q = queues.get(voice.guildId) || [];
      q.push(track);
      queues.set(voice.guildId, q);
      await interaction.editReply(`Added to queue: **${track.title}** (position ${q.length})`);
      await refreshPlayerPanel(voice.guildId, client, shoukaku);
      return;
    }

    const playable = await resolvePlayableEncoded(player.node.rest, track);
    await player.playTrack({ track: { encoded: playable.encoded } });
    const payload = await buildPanelPayload(voice.guildId, shoukaku);
    await interaction.editReply(payload);
    const reply = await interaction.fetchReply();
    playerPanels.set(voice.guildId, { channelId: reply.channelId, messageId: reply.id });
  } catch (err) {
    console.error('[play]', err);
    await interaction.editReply(formatPlaybackFailure(err));
  }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function handleStop(interaction, shoukaku, client) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
    return;
  }
  queues.delete(guildId);
  const player = shoukaku.players.get(guildId);
  if (player) {
    await player.stopTrack().catch(() => {});
    await shoukaku.leaveVoiceChannel(guildId).catch(() => {});
  }
  endListenerAttached.delete(guildId);
  await clearPlayerPanel(guildId, client, '⏹ Playback stopped.');
  await interaction.reply({ content: 'Stopped and left voice.', flags: MessageFlags.Ephemeral });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function handlePause(interaction, shoukaku, client) {
  const guildId = interaction.guildId;
  const player = guildId && shoukaku.players.get(guildId);
  if (!player?.track) {
    await interaction.reply({ content: 'Nothing is playing.', flags: MessageFlags.Ephemeral });
    return;
  }
  await player.setPaused(true);
  await refreshPlayerPanel(guildId, client, shoukaku);
  await interaction.reply({ content: 'Paused.', flags: MessageFlags.Ephemeral });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function handleResume(interaction, shoukaku, client) {
  const guildId = interaction.guildId;
  const player = guildId && shoukaku.players.get(guildId);
  if (!player) {
    await interaction.reply({ content: 'Not in voice.', flags: MessageFlags.Ephemeral });
    return;
  }
  await player.setPaused(false);
  await refreshPlayerPanel(guildId, client, shoukaku);
  await interaction.reply({ content: 'Resumed.', flags: MessageFlags.Ephemeral });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function handleSkip(interaction, shoukaku, client) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const player = shoukaku.players.get(guildId);
  const q = queues.get(guildId) || [];
  if (!player && q.length === 0) {
    await interaction.reply({ content: 'Nothing to skip.', flags: MessageFlags.Ephemeral });
    return;
  }
  const next = q.shift();
  queues.set(guildId, q);
  if (player && next) {
    const playable = await resolvePlayableEncoded(player.node.rest, next);
    await player.playTrack({ track: { encoded: playable.encoded } });
    await refreshPlayerPanel(guildId, client, shoukaku);
    await interaction.reply({ content: `Skipped. Now: **${next.title}**` });
    return;
  }
  if (player) {
    await player.stopTrack().catch(() => {});
    await shoukaku.leaveVoiceChannel(guildId).catch(() => {});
  }
  endListenerAttached.delete(guildId);
  await clearPlayerPanel(guildId, client, '⏹ Queue empty — stopped.');
  await interaction.reply({ content: 'Queue empty — stopped.', flags: MessageFlags.Ephemeral });
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
    await interaction.reply({ content: 'Queue is empty.', flags: MessageFlags.Ephemeral });
    return;
  }
  q.forEach((t, i) => lines.push(`${i + 1}. ${t.title}`));
  await interaction.reply({ content: lines.join('\n').slice(0, 1900), flags: MessageFlags.Ephemeral });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handleNowPlaying(interaction, shoukaku) {
  const guildId = interaction.guildId;
  const player = guildId && shoukaku.players.get(guildId);
  if (!player?.track) {
    await interaction.reply({ content: 'Nothing playing.', flags: MessageFlags.Ephemeral });
    return;
  }
  try {
    const decoded = await player.node.rest.decode(player.track);
    const title = decoded?.info?.title || 'Unknown';
    const paused = player.paused ? ' (paused)' : '';
    await interaction.reply({ content: `**Now playing:** ${title}${paused}`, flags: MessageFlags.Ephemeral });
  } catch {
    await interaction.reply({ content: 'Something is playing (could not decode title).', flags: MessageFlags.Ephemeral });
  }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function handleMusicButton(interaction, shoukaku, client) {
  const parsed = parseButtonId(interaction.customId);
  if (!parsed || parsed.guildId !== interaction.guildId) {
    await interaction.reply({ content: 'Invalid control.', flags: MessageFlags.Ephemeral });
    return;
  }

  const { guildId, action } = parsed;

  if (action === 'queue') {
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
      await interaction.reply({ content: 'Queue is empty.', flags: MessageFlags.Ephemeral });
      return;
    }
    q.forEach((t, i) => lines.push(`${i + 1}. ${t.title}`));
    await interaction.reply({ content: lines.join('\n').slice(0, 1900), flags: MessageFlags.Ephemeral });
    return;
  }

  if (!inSameVoiceAsBot(interaction, shoukaku)) {
    await interaction.reply({
      content:
        'Join the **same voice channel** as the bot to use these controls. If you already are, try again in a moment (Discord voice state can lag).',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const player = shoukaku.players.get(guildId);

  if (action === 'pause') {
    if (!player?.track) {
      await interaction.reply({ content: 'Nothing is playing.', flags: MessageFlags.Ephemeral });
      return;
    }
    await player.setPaused(true);
    const payload = await buildPanelPayload(guildId, shoukaku);
    await interaction.update(payload);
    return;
  }

  if (action === 'resume') {
    if (!player?.track) {
      await interaction.reply({ content: 'Nothing to resume.', flags: MessageFlags.Ephemeral });
      return;
    }
    await player.setPaused(false);
    const payload = await buildPanelPayload(guildId, shoukaku);
    await interaction.update(payload);
    return;
  }

  if (action === 'skip') {
    const q = queues.get(guildId) || [];
    if (!player && q.length === 0) {
      await interaction.reply({ content: 'Nothing to skip.', flags: MessageFlags.Ephemeral });
      return;
    }
    const next = q.shift();
    queues.set(guildId, q);
    if (player && next) {
      const playable = await resolvePlayableEncoded(player.node.rest, next);
      await player.playTrack({ track: { encoded: playable.encoded } });
      const payload = await buildPanelPayload(guildId, shoukaku);
      await interaction.update(payload);
      return;
    }
    if (player) {
      await player.stopTrack().catch(() => {});
      await shoukaku.leaveVoiceChannel(guildId).catch(() => {});
    }
    endListenerAttached.delete(guildId);
    playerPanels.delete(guildId);
    await interaction.update({ content: '⏹ Queue empty — stopped.', embeds: [], components: [] });
    return;
  }

  if (action === 'stop') {
    if (!player) {
      await interaction.reply({ content: 'Not in voice.', flags: MessageFlags.Ephemeral });
      return;
    }
    queues.delete(guildId);
    await player.stopTrack().catch(() => {});
    await shoukaku.leaveVoiceChannel(guildId).catch(() => {});
    endListenerAttached.delete(guildId);
    playerPanels.delete(guildId);
    await interaction.update({ content: '⏹ Stopped and left voice.', embeds: [], components: [] });
    return;
  }

  await interaction.reply({ content: 'Unknown action.', flags: MessageFlags.Ephemeral });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleHelp(interaction) {
  const playback =
    '`/play` `query` — Join your voice channel, then play or queue. Use a **link** or **search words** (default: YouTube). ' +
    'If many results match, you get a **menu** to pick the right track.\n' +
    '`/pause` — Pause what is playing (stays in voice).\n' +
    '`/resume` — Continue after a pause.\n' +
    '`/skip` — Next track in the queue, or stop if the queue is empty.\n' +
    '`/stop` — Stop, clear the queue, and leave voice.';

  const info =
    '`/queue` — Shows now playing + upcoming tracks *(only you see it)*.\n' +
    '`/nowplaying` — Current track title *(only you see it)*.\n' +
    '`/help` — This overview.';

  const search =
    '**Default:** plain text uses **YouTube search** (`ytsearch:`).\n' +
    '**SoundCloud:** prefix `scsearch:` e.g. `scsearch:artist name`.\n' +
    '**Other:** `ytsearch:`, `spsearch:`, etc., or paste a **direct URL** (YouTube, SoundCloud, Bandcamp, …).';

  const buttons =
    'After `/play` starts music, the bot may show **buttons** on the player message: **Pause**, **Resume**, **Skip**, **Stop**, **Queue**. ' +
    'Use **Pause** vs **Resume** for temporary silence; use **Stop** to fully disconnect. ' +
    '**Queue** can be used without being in voice; other buttons need you in the **same voice channel** as the bot.';

  const playlists =
    '`/playlist create` `name` — New empty list.\n' +
    '`/playlist list` — Your playlists and track counts.\n' +
    '`/playlist add` — Autocomplete **playlist** + `query` (URL or search; menu if several results).\n' +
    '`/playlist show` / `delete` / `play` — Inspect, remove, or queue the whole list (**play**: join voice first).\n' +
    '**Web:** use **Login / Register** on the site (email or Discord) → **Playlists** — same MongoDB as the API.\n' +
    '**Discord login** uses your **Discord user id** (matches these slash commands). **Email** accounts use a separate id for playlists.';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('DJ Ramu Kaka — commands')
    .setDescription('Join a **voice channel** before `/play`. Slash commands work anywhere in the server.')
    .addFields(
      { name: 'Playback', value: playback, inline: false },
      { name: 'Queue & info', value: info, inline: false },
      { name: 'Search & URLs', value: search, inline: false },
      { name: 'Playlists', value: playlists, inline: false },
      { name: 'Player buttons (in chat)', value: buttons, inline: false }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} client
 */
async function handleMusicCommand(interaction, shoukaku, client) {
  switch (interaction.commandName) {
    case 'help':
      return handleHelp(interaction);
    case 'play':
      return handlePlay(interaction, shoukaku, client);
    case 'stop':
      return handleStop(interaction, shoukaku, client);
    case 'pause':
      return handlePause(interaction, shoukaku, client);
    case 'resume':
      return handleResume(interaction, shoukaku, client);
    case 'skip':
      return handleSkip(interaction, shoukaku, client);
    case 'queue':
      return handleQueue(interaction, shoukaku);
    case 'nowplaying':
      return handleNowPlaying(interaction, shoukaku);
    default:
      return interaction.reply({ content: 'Unknown command.', flags: MessageFlags.Ephemeral });
  }
}

module.exports = {
  handleMusicCommand,
  handleMusicButton,
  handleMusicStringSelect,
  ensureVoice,
  playPlaylistInGuild,
  formatPlaybackFailure,
};
