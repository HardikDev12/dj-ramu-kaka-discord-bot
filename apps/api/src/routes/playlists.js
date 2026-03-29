const express = require('express');
const mongoose = require('mongoose');
const { Playlist } = require('@music-bot/db');
const { AppError } = require('../lib/app-error');
const { requireUser } = require('../middleware/auth');
const { requireDb } = require('../middleware/db-ready');

const router = express.Router();

router.use(requireDb);
router.use(requireUser);

function parseTracks(body) {
  if (body.tracks === undefined) return undefined;
  if (!Array.isArray(body.tracks)) {
    throw new AppError(400, 'INVALID_TRACKS', 'tracks must be an array');
  }
  return body.tracks.map((t, i) => {
    if (!t || typeof t !== 'object') {
      throw new AppError(400, 'INVALID_TRACK', `tracks[${i}] must be an object`);
    }
    const { title, url, duration } = t;
    if (typeof title !== 'string' || !title.trim()) {
      throw new AppError(400, 'INVALID_TRACK', `tracks[${i}].title required`);
    }
    if (typeof url !== 'string' || !url.trim()) {
      throw new AppError(400, 'INVALID_TRACK', `tracks[${i}].url required`);
    }
    const dur = duration === undefined ? 0 : Number(duration);
    if (!Number.isFinite(dur) || dur < 0) {
      throw new AppError(400, 'INVALID_TRACK', `tracks[${i}].duration must be a non-negative number`);
    }
    return { title: title.trim(), url: url.trim(), duration: dur };
  });
}

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const playlists = await Playlist.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json({ playlists });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const name = req.body?.name;
    if (typeof name !== 'string' || !name.trim()) {
      throw new AppError(400, 'INVALID_NAME', 'name is required');
    }
    const tracks = parseTracks(req.body) ?? [];
    const doc = await Playlist.create({
      userId,
      name: name.trim(),
      tracks,
    });
    res.status(201).json({ playlist: doc.toObject() });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'INVALID_ID', 'Invalid playlist id');
    }
    const playlist = await Playlist.findById(id).lean();
    if (!playlist) {
      throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
    }
    if (playlist.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Not your playlist');
    }
    res.json({ playlist });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'INVALID_ID', 'Invalid playlist id');
    }
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
    }
    if (playlist.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Not your playlist');
    }

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        throw new AppError(400, 'INVALID_NAME', 'name must be a non-empty string');
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

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'INVALID_ID', 'Invalid playlist id');
    }
    const result = await Playlist.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Playlist not found');
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
