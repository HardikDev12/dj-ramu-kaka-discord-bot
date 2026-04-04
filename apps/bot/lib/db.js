const { connect } = require('@music-bot/db');

/**
 * @returns {Promise<void>}
 */
async function ensureDb() {
  if (!process.env.MONGO_URI || !String(process.env.MONGO_URI).trim()) {
    throw new Error('Set **MONGO_URI** in `.env` (same as the API) to use playlists.');
  }
  await connect();
}

module.exports = { ensureDb };
