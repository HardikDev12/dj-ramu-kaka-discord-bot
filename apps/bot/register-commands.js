const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { REST, Routes } = require('discord.js');
const { commands } = require('./commands/definitions');

function stripQuotes(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/^["']|["']$/g, '');
}

async function registerSlashCommands() {
  const token = stripQuotes(process.env.DISCORD_TOKEN);
  const clientId = stripQuotes(process.env.CLIENT_ID);
  const guildId = stripQuotes(process.env.DISCORD_GUILD_ID || '');

  if (!token || !clientId) {
    throw new Error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
  }

  const rest = new REST({ version: '10' }).setToken(token);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`Registered ${commands.length} slash command(s) to guild ${guildId} (updates in seconds).`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(
      `Registered ${commands.length} global slash command(s). They can take up to ~1 hour to appear — set DISCORD_GUILD_ID in .env for instant testing.`
    );
  }
}

if (require.main === module) {
  registerSlashCommands()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { registerSlashCommands };
