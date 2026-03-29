const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const cookieSession = require('cookie-session');
const express = require('express');
const cors = require('cors');
const { connect } = require('@music-bot/db');

const { notFoundHandler, errorHandler } = require('./middleware/error');
const authRoutes = require('./routes/auth');
const playlistsRoutes = require('./routes/playlists');
const analyticsRoutes = require('./routes/analytics');

const app = express();
app.set('trust proxy', 1);

const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  })
);
app.use(express.json());

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
  console.error('SESSION_SECRET is required in production');
  process.exit(1);
}

app.use(
  cookieSession({
    name: 'mbs_session',
    keys: [sessionSecret || 'dev-only-change-SESSION_SECRET'],
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'music-bot-api' });
});

app.use('/auth', authRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.API_PORT || 3001);

async function start() {
  if (process.env.MONGO_URI) {
    try {
      await connect();
      console.log('MongoDB connected');
    } catch (err) {
      console.warn('MongoDB connection failed — playlist/analytics routes return 503:', err.message);
    }
  } else {
    console.warn('MONGO_URI not set — playlist/analytics routes return 503 until configured');
  }

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
