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

function isLavalinkUnreachable(error) {
  const e = error && typeof error === 'object' ? error : { message: String(error) };
  const msg = String(e.message || e);
  const code = e.code;
  return (
    code === 'ECONNREFUSED' ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('Websocket closed before a connection was established')
  );
}

/** While Lavalink is down, Shoukaku retries and emits many errors — show one hint only. */
let lavalinkDownMuted = false;
shoukaku.on('error', (nodeName, error) => {
  if (isLavalinkUnreachable(error)) {
    if (!lavalinkDownMuted) {
      lavalinkDownMuted = true;
      console.warn(
        `[Lavalink] Not reachable at ${lavalinkHost}:${lavalinkPort} (node "${nodeName}"). ` +
          'Further connection errors are hidden until it is up.\n' +
          '  Start: cd services/lavalink && java -jar ../../Lavalink.jar'
      );
    }
    return;
  }
  console.error(`Shoukaku error [${nodeName}]:`, error);
});

let lavalinkReadyLogged = false;
shoukaku.on('ready', (nodeName) => {
  if (lavalinkDownMuted) {
    console.log(`[Lavalink] Node "${nodeName}" connected.`);
  } else if (!lavalinkReadyLogged) {
    lavalinkReadyLogged = true;
    console.log(`[Lavalink] Node "${nodeName}" ready`);
  }
  lavalinkDownMuted = false;
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
