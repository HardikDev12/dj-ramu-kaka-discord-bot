const { randomBytes } = require('crypto');
const {
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const { Playlist, mongoose } = require('@music-bot/db');
const { ensureDb } = require('../lib/db');
const {
  resolveQueryToOutcome,
  queuedTrackToPlaylistEntry,
} = require('../lib/lavalink-query');
const { ensureVoice, playPlaylistInGuild, formatPlaybackFailure } = require('./music');

const PL_PICK_PREFIX = 'djrkplpick';
const PL_PICK_TTL_MS = 10 * 60 * 1000;
const MAX_PICK_OPTIONS = 25;

/** @type {Map<string, { userId: string; playlistId: string; tracks: import('../lib/lavalink-query').QueuedTrack[]; created: number }>} */
const playlistPickSessions = new Map();

function truncate(str, max) {
  const s = String(str ?? '');
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function takePlaylistPickSession(nonce) {
  const row = playlistPickSessions.get(nonce);
  if (!row) return null;
  if (Date.now() - row.created > PL_PICK_TTL_MS) {
    playlistPickSessions.delete(nonce);
    return null;
  }
  return row;
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function ensureLavalinkForResolve(interaction, shoukaku) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Use this in a server.', flags: MessageFlags.Ephemeral });
    return null;
  }
  const node = shoukaku.getIdealNode();
  if (!node) {
    await interaction.reply({
      content:
        'No Lavalink node connected. Wait for **`[Lavalink] Node "main" connected`** then try again.',
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }
  return node;
}

/**
 * @param {import('discord.js').AutocompleteInteraction} interaction
 */
async function handlePlaylistAutocomplete(interaction) {
  try {
    await ensureDb();
  } catch (e) {
    return interaction.respond([]);
  }
  const focused = interaction.options.getFocused(true);
  if (focused.name !== 'playlist') return interaction.respond([]);
  const userId = interaction.user.id;
  const q = focused.value.trim();
  const filter = q
    ? { userId, name: new RegExp(escapeRegex(q), 'i') }
    : { userId };
  const list = await Playlist.find(filter).sort({ updatedAt: -1 }).limit(25).select('name tracks').lean();
  await interaction.respond(
    list.map((p) => {
      const n = p.tracks?.length ?? 0;
      const label = truncate(`${p.name} (${n} tracks)`, 100);
      return { name: label, value: String(p._id) };
    })
  );
}

/**
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 */
async function handlePlaylistStringSelect(interaction, shoukaku) {
  const prefix = `${PL_PICK_PREFIX}:`;
  if (!interaction.customId.startsWith(prefix)) return;
  const nonce = interaction.customId.slice(prefix.length);
  const session = takePlaylistPickSession(nonce);
  if (!session) {
    await interaction.reply({ content: 'This menu expired. Run `/playlist add` again.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (session.userId !== interaction.user.id) {
    await interaction.reply({ content: 'Only the person who ran `/playlist add` can choose.', flags: MessageFlags.Ephemeral });
    return;
  }
  const idx = Number.parseInt(interaction.values[0], 10);
  const track = session.tracks[idx];
  if (!track || Number.isNaN(idx)) {
    playlistPickSessions.delete(nonce);
    await interaction.reply({ content: 'Invalid choice.', flags: MessageFlags.Ephemeral });
    return;
  }
  playlistPickSessions.delete(nonce);
  const node = shoukaku.getIdealNode();
  if (!node) {
    await interaction.reply({ content: 'Lavalink disconnected.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferUpdate();
  try {
    const playlist = await Playlist.findById(session.playlistId);
    if (!playlist || playlist.userId !== interaction.user.id) {
      await interaction.message.edit({ content: 'Playlist not found.', embeds: [], components: [] }).catch(() => {});
      return;
    }
    const entry = await queuedTrackToPlaylistEntry(node.rest, track);
    playlist.tracks.push(entry);
    await playlist.save();
    await interaction.message
      .edit({
        content: `Added **${entry.title}** to **${playlist.name}** — **${playlist.tracks.length}** tracks total.`,
        embeds: [],
        components: [],
      })
      .catch(() => {});
  } catch (err) {
    console.error('[playlist pick]', err);
    await interaction.message
      .edit({ content: formatPlaybackFailure(err), embeds: [], components: [] })
      .catch(() => {});
  }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('shoukaku').Shoukaku} shoukaku
 * @param {import('discord.js').Client} _client
 */
async function handlePlaylistCommand(interaction, shoukaku, _client) {
  const sub = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  try {
    await ensureDb();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
  }

  if (sub === 'create') {
    const name = interaction.options.getString('name', true).trim();
    if (!name) {
      return interaction.reply({ content: 'Name cannot be empty.', flags: MessageFlags.Ephemeral });
    }
    if (name.length > 100) {
      return interaction.reply({ content: 'Name must be 100 characters or fewer.', flags: MessageFlags.Ephemeral });
    }
    const doc = await Playlist.create({ userId, name, tracks: [] });
    return interaction.reply({
      content: `Created playlist **${doc.name}**. Add tracks with \`/playlist add\` (pick this playlist from the autocomplete menu).`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (sub === 'list') {
    const playlists = await Playlist.find({ userId }).sort({ updatedAt: -1 }).limit(25).lean();
    if (!playlists.length) {
      return interaction.reply({ content: 'You have no playlists yet. Use `/playlist create`.', flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Your playlists')
      .setDescription(
        playlists.map((p, i) => `${i + 1}. **${truncate(p.name, 80)}** — ${p.tracks?.length ?? 0} tracks`).join('\n')
      );
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  const playlistId = interaction.options.getString('playlist', true);
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    return interaction.reply({ content: 'Invalid playlist selection. Use the autocomplete menu.', flags: MessageFlags.Ephemeral });
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist || playlist.userId !== userId) {
    return interaction.reply({ content: 'Playlist not found.', flags: MessageFlags.Ephemeral });
  }

  if (sub === 'show') {
    const tracks = playlist.tracks || [];
    if (!tracks.length) {
      return interaction.reply({
        content: `**${playlist.name}** is empty. Use \`/playlist add\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const lines = tracks.map((t, i) => `${i + 1}. ${truncate(t.title, 90)}`);
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(playlist.name)
      .setDescription(truncate(lines.join('\n'), 4000));
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  if (sub === 'delete') {
    await Playlist.deleteOne({ _id: playlistId, userId });
    return interaction.reply({
      content: `Deleted playlist **${playlist.name}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (sub === 'play') {
    const voice = await ensureVoice(interaction, shoukaku);
    if (!voice) return;
    const tracks = playlist.tracks || [];
    if (!tracks.length) {
      return interaction.reply({ content: 'That playlist is empty.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply();
    try {
      await playPlaylistInGuild({
        guildId: voice.guildId,
        channelId: voice.channelId,
        interaction,
        client: interaction.client,
        shoukaku,
        tracks,
      });
    } catch (err) {
      console.error('[playlist play]', err);
      await interaction.editReply(formatPlaybackFailure(err));
    }
    return;
  }

  if (sub === 'add') {
    const node = await ensureLavalinkForResolve(interaction, shoukaku);
    if (!node) return;
    const query = interaction.options.getString('query', true);
    await interaction.deferReply();
    try {
      const outcome = await resolveQueryToOutcome(node.rest, query);
      if (outcome.kind === 'error') {
        await interaction.editReply(`**Resolve failed:** ${outcome.message}`);
        return;
      }
      if (outcome.kind === 'empty') {
        await interaction.editReply('No results for that query. Try a direct URL or a clearer search.');
        return;
      }
      if (outcome.kind === 'pick') {
        const slice = outcome.tracks.slice(0, MAX_PICK_OPTIONS);
        const nonce = randomBytes(16).toString('hex');
        playlistPickSessions.set(nonce, {
          userId: interaction.user.id,
          playlistId: String(playlist._id),
          tracks: slice,
          created: Date.now(),
        });
        const options = slice.map((t, i) => {
          const label = truncate(`${i + 1}. ${t.title}`, 100);
          const opt = new StringSelectMenuOptionBuilder().setLabel(label).setValue(String(i));
          const desc = truncate(t.author, 100);
          if (desc) opt.setDescription(desc);
          return opt;
        });
        const select = new StringSelectMenuBuilder()
          .setCustomId(`${PL_PICK_PREFIX}:${nonce}`)
          .setPlaceholder('Pick a track to add…')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(options);
        const row = new ActionRowBuilder().addComponents(select);
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`Add to: ${truncate(playlist.name, 200)}`)
          .setDescription(
            `Choose one result for **${truncate(query, 200)}** — only you can confirm.`
          );
        await interaction.editReply({ embeds: [embed], content: null, components: [row] });
        return;
      }
      const entry = await queuedTrackToPlaylistEntry(node.rest, outcome.track);
      playlist.tracks.push(entry);
      await playlist.save();
      await interaction.editReply(
        `Added **${entry.title}** to **${playlist.name}** — **${playlist.tracks.length}** tracks total.`
      );
    } catch (err) {
      console.error('[playlist add]', err);
      await interaction.editReply(formatPlaybackFailure(err));
    }
    return;
  }

  return interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
}

module.exports = {
  handlePlaylistCommand,
  handlePlaylistAutocomplete,
  handlePlaylistStringSelect,
};
