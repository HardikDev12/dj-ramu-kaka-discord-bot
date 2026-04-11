const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Client, GatewayIntentBits, Events, MessageFlags } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');

/** Shoukaku's stock connector uses `shards.get(shardId)` only; a key mismatch drops OP 4 silently and voice never completes. */
class DiscordJSAudioConnector extends Connectors.DiscordJS {
  sendPacket(shardId, payload, important) {
    const shards = this.client.ws.shards;
    let shard = shards.get(shardId);
    if (!shard && shards.size > 0) shard = shards.first();
    return shard?.send(payload, important);
  }
}
const { registerSlashCommands } = require('./register-commands');
const {
  handleMusicCommand,
  handleMusicButton,
  handleMusicStringSelect,
  onBotDisconnectedFromVoice,
} = require('./handlers/music');
const {
  handlePlaylistCommand,
  handlePlaylistAutocomplete,
  handlePlaylistStringSelect,
} = require('./handlers/playlists');
const {
  guildInteractionCooldownTier,
  tryConsumeGuildCooldown,
} = require('./lib/guild-cooldown');

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const lavalinkHost = process.env.LAVALINK_HOST || '127.0.0.1';
const lavalinkPort = parseInt(process.env.LAVALINK_PORT || '2333', 10);
const lavalinkPassword = process.env.LAVALINK_PASSWORD || 'youshallnotpass';

/**
 * Wait until Lavalink's REST stack answers (401/200 on /v4/info). Port 2333 can accept TCP
 * before Spring has finished wiring the v4 WebSocket; connecting too early can yield an immediate 1000 close.
 */
function waitForLavalinkHttp(hostname, port, maxWaitMs = 120000) {
  const deadline = Date.now() + maxWaitMs;
  return new Promise((resolve) => {
    const poll = () => {
      if (Date.now() >= deadline) {
        console.warn('[Lavalink] Timed out waiting for /v4/info; connecting Shoukaku anyway.');
        return resolve();
      }
      const req = http.request(
        {
          hostname,
          port,
          path: '/v4/info',
          method: 'GET',
          timeout: 2000,
        },
        (res) => {
          res.resume();
          if (res.statusCode === 401 || res.statusCode === 200) return resolve();
          setTimeout(poll, 300);
        }
      );
      req.on('error', () => setTimeout(poll, 300));
      req.on('timeout', () => {
        req.destroy();
        setTimeout(poll, 300);
      });
      req.end();
    };
    poll();
  });
}

// Empty nodes: connector still sets bot user id on clientReady; we addNode() after HTTP is live (see ClientReady).
const shoukaku = new Shoukaku(new DiscordJSAudioConnector(client), [], {
  reconnectTries: 30,
  reconnectInterval: 3,
  voiceConnectionTimeout: 30,
});

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

let lavalinkDownMuted = false;
shoukaku.on('error', (nodeName, error) => {
  if (isLavalinkUnreachable(error)) {
    if (!lavalinkDownMuted) {
      lavalinkDownMuted = true;
      console.warn(
        `[Lavalink] Not reachable at ${lavalinkHost}:${lavalinkPort} (node "${nodeName}"). ` +
          'If you use npm run dev, the [lava] process may still be booting—wait for ' +
          '"Lavalink is ready to accept connections", then watch for [Lavalink] Node "main" connected.\n' +
          '  Manual start: cd services/lavalink && java -jar Lavalink.jar (Java 17+)'
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

shoukaku.on('close', (nodeName, code) => {
  console.warn(
    `[Lavalink] WebSocket closed on node "${nodeName}" (code ${code}). Shoukaku will retry if attempts remain.`
  );
});

if (process.env.SHOUKAKU_DEBUG === '1') {
  shoukaku.on('debug', (nodeName, msg) => console.log(`[shoukaku:${nodeName}]`, msg));
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Bot logged in as ${c.user.tag}`);
  const lavaHttpReady = waitForLavalinkHttp(lavalinkHost, lavalinkPort);
  try {
    await registerSlashCommands();
  } catch (err) {
    console.error('Slash command registration failed:', err.message);
    console.error('Fix .env or run: npm run register-commands -w @music-bot/bot');
  }
  await lavaHttpReady;
  shoukaku.addNode({
    name: 'main',
    url: `${lavalinkHost}:${lavalinkPort}`,
    auth: lavalinkPassword,
  });
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (newState.id !== client.user?.id) return;
  if (oldState.channelId && !newState.channelId) {
    onBotDisconnectedFromVoice(newState.guild.id, client, shoukaku);
  }
});

/**
 * Per-guild spam guard (see lib/guild-cooldown.js). Does not apply to autocomplete.
 */
async function replyGuildCooldown(interaction, retryAfterSec) {
  const msg = `This server is using music commands too quickly. Try again in **${retryAfterSec}**s.`;
  const flags = MessageFlags.Ephemeral;
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: msg, flags });
      return;
    }
    await interaction.reply({ content: msg, flags });
  } catch {
    /* ignore */
  }
}

async function routeMusicInteraction(interaction) {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'playlist') {
      return handlePlaylistCommand(interaction, shoukaku, client);
    }
    return handleMusicCommand(interaction, shoukaku, client);
  }
  if (interaction.isButton() && interaction.customId.startsWith('djrk:')) {
    return handleMusicButton(interaction, shoukaku, client);
  }
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('djrkpick:')) {
    return handleMusicStringSelect(interaction, shoukaku, client);
  }
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('djrkplpick:')) {
    return handlePlaylistStringSelect(interaction, shoukaku, client);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isAutocomplete() && interaction.commandName === 'playlist') {
      await handlePlaylistAutocomplete(interaction);
      return;
    }

    const cdTier = guildInteractionCooldownTier(interaction);
    if (cdTier && interaction.guildId) {
      const cd = tryConsumeGuildCooldown(interaction.guildId, cdTier);
      if (!cd.ok) {
        await replyGuildCooldown(interaction, cd.retryAfterSec);
        return;
      }
    }

    await routeMusicInteraction(interaction);
  } catch (err) {
    console.error('[interaction]', err);
    const text = 'Something went wrong.';
    try {
      if (interaction.isAutocomplete()) {
        await interaction.respond([]);
      } else if (interaction.deferred && !interaction.replied) {
        await interaction.editReply(text);
      } else if (interaction.replied) {
        await interaction.followUp({ content: text, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: text, flags: MessageFlags.Ephemeral });
      }
    } catch {
      /* ignore */
    }
  }
});

if (!token) {
  console.error('Set DISCORD_TOKEN in .env');
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error('Login failed:', err);
  process.exit(1);
});
