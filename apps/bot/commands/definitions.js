const { SlashCommandBuilder } = require('discord.js');

/** @type {import('discord.js').RESTPostAPIApplicationCommandsJSONBody[]} */
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play audio from a URL or search (SoundCloud: scsearch:your query)')
    .addStringOption((o) =>
      o.setName('query').setDescription('URL or search, e.g. scsearch:artist name').setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder().setName('stop').setDescription('Stop playback, clear queue, and leave voice').toJSON(),
  new SlashCommandBuilder().setName('pause').setDescription('Pause the current track').toJSON(),
  new SlashCommandBuilder().setName('resume').setDescription('Resume playback').toJSON(),
  new SlashCommandBuilder().setName('skip').setDescription('Skip to the next track in the queue').toJSON(),
  new SlashCommandBuilder().setName('queue').setDescription('Show the current queue').toJSON(),
  new SlashCommandBuilder().setName('nowplaying').setDescription('Show the track that is playing').toJSON(),
];

module.exports = { commands };
