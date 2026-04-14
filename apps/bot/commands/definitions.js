const { SlashCommandBuilder } = require('discord.js');

/** @type {import('discord.js').RESTPostAPIApplicationCommandsJSONBody[]} */
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription(
      'URL or search — YouTube by default; use scsearch: for SoundCloud; picker if several match',
    )
    .addStringOption((o) =>
      o.setName('query').setDescription('URL, or search text — pick from list when several match').setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder().setName('stop').setDescription('Stop playback, clear queue, and leave voice').toJSON(),
  new SlashCommandBuilder().setName('pause').setDescription('Pause the current track').toJSON(),
  new SlashCommandBuilder().setName('resume').setDescription('Resume playback').toJSON(),
  new SlashCommandBuilder().setName('skip').setDescription('Skip to the next track in the queue').toJSON(),
  new SlashCommandBuilder().setName('queue').setDescription('Show the current queue').toJSON(),
  new SlashCommandBuilder().setName('nowplaying').setDescription('Show the track that is playing').toJSON(),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all music commands, search tips, and button controls')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Saved playlists in MongoDB (Discord id matches web Discord login; email is separate)')
    .addSubcommand((sc) =>
      sc
        .setName('create')
        .setDescription('Create an empty playlist')
        .addStringOption((o) =>
          o.setName('name').setDescription('Name for the playlist').setRequired(true).setMaxLength(100)
        )
    )
    .addSubcommand((sc) => sc.setName('list').setDescription('List your playlists and track counts'))
    .addSubcommand((sc) =>
      sc
        .setName('add')
        .setDescription('Add a track (URL or search — pick from list if several match)')
        .addStringOption((o) =>
          o.setName('playlist').setDescription('Target playlist').setRequired(true).setAutocomplete(true)
        )
        .addStringOption((o) =>
          o.setName('query').setDescription('Track URL or search words').setRequired(true).setMaxLength(500)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('show')
        .setDescription('Show tracks in a playlist')
        .addStringOption((o) =>
          o.setName('playlist').setDescription('Which playlist').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('delete')
        .setDescription('Delete a playlist')
        .addStringOption((o) =>
          o.setName('playlist').setDescription('Which playlist').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('load')
        .setDescription('Queue every track from a saved playlist (join voice first; not the same as /play)')
        .addStringOption((o) =>
          o.setName('playlist').setDescription('Which playlist').setRequired(true).setAutocomplete(true)
        )
    )
    .toJSON(),
];

module.exports = { commands };
