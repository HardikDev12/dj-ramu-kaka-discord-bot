const express = require('express');
const mongoose = require('mongoose');
const { Playlist, User } = require('@music-bot/db');
const { AppError } = require('../lib/app-error');
const { requireDb } = require('../middleware/db-ready');
const { requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireDb);
router.use(requireSuperAdmin);

function parseTracks(body) {
  if (body.tracks === undefined) return undefined;
  if (!Array.isArray(body.tracks)) {
    throw new AppError(400, 'INVALID_TRACKS', 'tracks must be an array');
  }
  return body.tracks.map((t, i) => {
    if (!t || typeof t !== 'object') throw new AppError(400, 'INVALID_TRACK', `tracks[${i}] must be object`);
    const title = typeof t.title === 'string' ? t.title.trim() : '';
    const url = typeof t.url === 'string' ? t.url.trim() : '';
    const duration = Number.isFinite(Number(t.duration)) && Number(t.duration) >= 0 ? Number(t.duration) : 0;
    if (!title || !url) throw new AppError(400, 'INVALID_TRACK', `tracks[${i}] requires title/url`);
    return { title, url, duration };
  });
}

router.get('/stats', async (_req, res, next) => {
  try {
    const [totalUsers, totalPlaylists, agg] = await Promise.all([
      User.countDocuments({}),
      Playlist.countDocuments({}),
      Playlist.aggregate([
        { $project: { trackCount: { $size: { $ifNull: ['$tracks', []] } } } },
        { $group: { _id: null, totalTracks: { $sum: '$trackCount' } } },
      ]),
    ]);
    res.json({
      stats: {
        totalUsers,
        totalPlaylists,
        totalTracks: agg[0]?.totalTracks || 0,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find({}).select('_id email displayName createdAt').lean();
    const playlistAgg = await Playlist.aggregate([
      {
        $project: {
          userId: 1,
          trackCount: { $size: { $ifNull: ['$tracks', []] } },
        },
      },
      {
        $group: {
          _id: '$userId',
          playlistCount: { $sum: 1 },
          trackCount: { $sum: '$trackCount' },
        },
      },
    ]);

    const aggMap = new Map(playlistAgg.map((x) => [String(x._id), x]));
    const userIdsFromAgg = new Set(playlistAgg.map((x) => String(x._id)));
    const knownIds = new Set(users.map((u) => String(u._id)));
    const discordOnlyIds = [...userIdsFromAgg].filter((id) => !knownIds.has(id));

    const normalizedUsers = [
      ...users.map((u) => {
        const stats = aggMap.get(String(u._id)) || {};
        return {
          id: String(u._id),
          email: u.email,
          name: u.displayName || u.email.split('@')[0],
          provider: 'local',
          playlistCount: stats.playlistCount || 0,
          trackCount: stats.trackCount || 0,
          serverCount: stats.playlistCount || 0,
          createdAt: u.createdAt,
        };
      }),
      ...discordOnlyIds.map((id) => {
        const stats = aggMap.get(id) || {};
        return {
          id,
          email: '',
          name: `Discord User ${id.slice(0, 6)}`,
          provider: 'discord',
          playlistCount: stats.playlistCount || 0,
          trackCount: stats.trackCount || 0,
          serverCount: stats.playlistCount || 0,
          createdAt: null,
        };
      }),
    ].sort((a, b) => (b.playlistCount || 0) - (a.playlistCount || 0));

    res.json({ users: normalizedUsers });
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId/playlists', async (req, res, next) => {
  try {
    const userId = String(req.params.userId || '').trim();
    if (!userId) throw new AppError(400, 'INVALID_USER', 'userId required');
    const playlists = await Playlist.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json({ playlists });
  } catch (e) {
    next(e);
  }
});

router.patch('/users/:userId/playlists/:playlistId', async (req, res, next) => {
  try {
    const userId = String(req.params.userId || '').trim();
    const playlistId = req.params.playlistId;
    if (!userId) throw new AppError(400, 'INVALID_USER', 'userId required');
    if (!mongoose.Types.ObjectId.isValid(playlistId)) throw new AppError(400, 'INVALID_ID', 'Invalid playlist id');

    const playlist = await Playlist.findOne({ _id: playlistId, userId });
    if (!playlist) throw new AppError(404, 'NOT_FOUND', 'Playlist not found');

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        throw new AppError(400, 'INVALID_NAME', 'name must be non-empty');
      }
      playlist.name = req.body.name.trim();
    }
    if (req.body.tracks !== undefined) {
      playlist.tracks = parseTracks(req.body);
    }
    await playlist.save();
    res.json({ playlist: playlist.toObject() });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
