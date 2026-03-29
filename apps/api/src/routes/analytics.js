const express = require('express');
const { AnalyticsEvent } = require('@music-bot/db');
const { AppError } = require('../lib/app-error');
const { requireDb } = require('../middleware/db-ready');
const { attachUser } = require('../middleware/auth');

const router = express.Router();

router.use(requireDb);
router.use(attachUser);

function isInternalCaller(req) {
  const key = process.env.BOT_INTERNAL_KEY;
  if (!key) return false;
  const sent = req.get('x-internal-key');
  return sent === key;
}

router.post('/plays', async (req, res, next) => {
  try {
    const track = req.body?.track;
    if (typeof track !== 'string' || !track.trim()) {
      throw new AppError(400, 'INVALID_TRACK', 'track (string) is required');
    }

    let userId;
    if (isInternalCaller(req)) {
      userId = req.body?.userId;
      if (typeof userId !== 'string' || !userId.trim()) {
        throw new AppError(400, 'INVALID_USER', 'userId required for internal calls');
      }
      userId = userId.trim();
    } else if (req.user?.id) {
      userId = req.user.id;
    } else {
      throw new AppError(401, 'UNAUTHORIZED', 'Sign in or provide X-Internal-Key');
    }

    const doc = await AnalyticsEvent.create({
      track: track.trim(),
      userId,
    });

    res.status(201).json({
      event: {
        id: doc._id.toString(),
        track: doc.track,
        userId: doc.userId,
        timestamp: doc.timestamp,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
