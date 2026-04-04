/**
 * Minimal Discord.js-like client to see if Shoukaku stays connected to local Lavalink.
 * Run while Lavalink is up: node scripts/shoukaku-smoke.js
 */
const EventEmitter = require('events');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Shoukaku, Connectors } = require('shoukaku');

const client = new EventEmitter();
client.user = { id: process.env.DISCORD_APP_ID || '123456789012345678' };
client.ws = {
  shards: new Map([[0, { send: () => {} }]]),
};

const pass = process.env.LAVALINK_PASSWORD || 'youshallnotpass';
const shoukaku = new Shoukaku(
  new Connectors.DiscordJS(client),
  [{ name: 'main', url: '127.0.0.1:2333', auth: pass }],
  { reconnectTries: 5, reconnectInterval: 2 }
);

shoukaku.on('debug', (name, msg) => console.log('[debug]', name, msg));
shoukaku.on('error', (name, err) => console.log('[error]', name, err?.message || err));
shoukaku.on('ready', (name) => console.log('[ready]', name));
shoukaku.on('close', (name, code) => console.log('[close]', name, code));

setImmediate(() => {
  console.log('emit clientReady, user id=', client.user.id);
  client.emit('clientReady', client);
});

setTimeout(() => {
  const n = shoukaku.getIdealNode();
  console.log('after 3s getIdealNode:', n ? 'CONNECTED' : 'NONE', n?.sessionId);
  process.exit(n ? 0 : 1);
}, 3000);
scsearch