const { mongoose } = require('@music-bot/db');
const { AppError } = require('../lib/app-error');

function requireDb(_req, _res, next) {
  if (mongoose.connection.readyState !== 1) {
    return next(new AppError(503, 'DB_UNAVAILABLE', 'Database is not connected'));
  }
  next();
}

module.exports = { requireDb };
