const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    tracks: [trackSchema],
  },
  { timestamps: true }
);

const analyticsSchema = new mongoose.Schema({
  track: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

/**
 * @param {string} [uri]
 * @returns {Promise<typeof mongoose.connection>}
 */
async function connect(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI is required');
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  return mongoose.connect(uri);
}

const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);
const AnalyticsEvent =
  mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsSchema);

module.exports = {
  connect,
  mongoose,
  Playlist,
  AnalyticsEvent,
};
