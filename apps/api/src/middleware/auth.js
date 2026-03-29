const { AppError } = require('../lib/app-error');

function requireUser(req, _res, next) {
  const user = req.session?.user;
  if (!user?.id) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Sign in required'));
  }
  next();
}

/** Attach req.user from session if present */
function attachUser(req, _res, next) {
  if (req.session?.user?.id) {
    req.user = req.session.user;
  }
  next();
}

module.exports = { requireUser, attachUser };
