const { AppError } = require('../lib/app-error');

function notFoundHandler(_req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
}

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err instanceof AppError ? err.status : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const message =
    err instanceof AppError
      ? err.message
      : process.env.NODE_ENV === 'production'
        ? 'Unexpected error'
        : err.message || 'Unexpected error';

  if (status >= 500) {
    console.error('[api]', err);
  }

  res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
