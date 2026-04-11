/**
 * PM2 process file for Oracle Cloud (or any Linux host).
 * Edit MUSIC_BOT_ROOT if your clone is not /opt/music-bot.
 *
 * Usage (once Node deps are installed from repo root):
 *   cd /opt/music-bot && npm ci --omit=dev && pm2 start deploy/ecosystem.config.cjs
 */
const MUSIC_BOT_ROOT = process.env.MUSIC_BOT_ROOT || '/opt/music-bot';

module.exports = {
  apps: [
    {
      name: 'music-api',
      cwd: `${MUSIC_BOT_ROOT}/apps/api`,
      script: 'src/index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'music-bot',
      cwd: `${MUSIC_BOT_ROOT}/apps/bot`,
      script: 'index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      env: { NODE_ENV: 'production' },
    },
  ],
};
