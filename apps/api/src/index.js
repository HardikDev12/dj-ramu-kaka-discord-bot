const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const express = require('express');
const cors = require('cors');
const { connect } = require('@music-bot/db');

const app = express();
app.use(
  cors({
    origin: process.env.WEB_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'music-bot-api' });
});

const port = Number(process.env.API_PORT || 3001);

async function start() {
  if (process.env.MONGO_URI) {
    try {
      await connect();
      console.log('MongoDB connected');
    } catch (err) {
      console.warn('MongoDB connection failed — continuing for health checks only:', err.message);
    }
  } else {
    console.warn('MONGO_URI not set — playlist routes will fail until configured');
  }

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
