const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { REST, Routes } = require('discord.js');

function stripQuotes(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/^["']|["']$/g, '');
}

async function clearGlobalCommands() {
  const token = stripQuotes(process.env.DISCORD_TOKEN);
  const clientId = stripQuotes(process.env.CLIENT_ID);

  if (!token || !clientId) {
    throw new Error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
  }

  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), { body: [] });
  console.log(
    'Cleared all global application (/) commands for this app. Guild-registered commands are unchanged.',
  );
}

if (require.main === module) {
  clearGlobalCommands()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { clearGlobalCommands };
