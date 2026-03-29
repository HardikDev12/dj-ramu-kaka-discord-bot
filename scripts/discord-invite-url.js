/**
 * Prints an OAuth invite URL so you can add the bot to a server.
 * Uses CLIENT_ID from repo root .env (same as Discord "Application ID").
 */
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const clientId = process.env.CLIENT_ID?.replace(/^["']|["']$/g, '').trim();

// View channels, send msgs, embed, history, connect, speak, voice activity
const permissions = '36785152';

if (!clientId) {
  console.error('Set CLIENT_ID in .env (Discord Application ID).');
  process.exit(1);
}

const url = new URL('https://discord.com/oauth2/authorize');
url.searchParams.set('client_id', clientId);
url.searchParams.set('permissions', permissions);
url.searchParams.set('scope', 'bot applications.commands');

console.log('\nOpen this link while logged into Discord (you need "Manage Server" on the target server):\n');
console.log(url.toString());
console.log('\nAfter install: pick a voice channel and run slash commands there once Phase 3 registers them.\n');
