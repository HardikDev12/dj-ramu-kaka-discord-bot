const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Client, GatewayIntentBits, Events } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const lavalinkHost = process.env.LAVALINK_HOST || '127.0.0.1';
const lavalinkPort = parseInt(process.env.LAVALINK_PORT || '2333', 10);
const lavalinkPassword = process.env.LAVALINK_PASSWORD || 'youshallnotpass';

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), [
  {
    name: 'main',
    url: `${lavalinkHost}:${lavalinkPort}`,
    auth: lavalinkPassword,
  },
]);

let lavalinkRefusedLogged = false;
shoukaku.on('error', (_, error) => {
  if (error?.code === 'ECONNREFUSED' && !lavalinkRefusedLogged) {
    lavalinkRefusedLogged = true;
    console.warn(
      `[Lavalink] Nothing listening on ${lavalinkHost}:${lavalinkPort}. Start the server:\n` +
        `  cd services/lavalink && java -jar ../../Lavalink.jar`
    );
    return;
  }
  console.error('Shoukaku error:', error);
});

client.once(Events.ClientReady, () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  console.log('Slash commands and playback: implement in Phase 3 (see .planning/ROADMAP.md)');
});

if (!token) {
  console.error('Set DISCORD_TOKEN in .env');
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error('Login failed:', err);
  process.exit(1);
});
