const { User, mongoose } = require('@music-bot/db');
const { resolveUserRole } = require('./roles');
const { isProfileComplete, discordAvatarUrl, isMongoId } = require('./profile');

/**
 * Full user payload for GET /auth/me and PATCH /api/user/profile responses.
 * @param {import('express').Request} req
 */
async function getMePayload(req) {
  const sessionUser = req.session?.user;
  if (!sessionUser?.id) return null;

  const role = resolveUserRole(sessionUser);
  let out = { ...sessionUser, role };

  if (mongoose.connection.readyState === 1 && sessionUser.provider === 'local' && isMongoId(sessionUser.id)) {
    const u = await User.findById(sessionUser.id).lean();
    if (u) {
      out.email = u.email;
      out.firstName = u.firstName || '';
      out.lastName = u.lastName || '';
      out.displayName = u.displayName || '';
      out.username = u.displayName || u.email.split('@')[0];
      if (u.discord?.userId && u.discord?.avatar) {
        out.avatarUrl = discordAvatarUrl(u.discord.userId, u.discord.avatar);
      }
    }
  } else if (sessionUser.provider === 'discord') {
    out.firstName = sessionUser.firstName ?? '';
    out.lastName = sessionUser.lastName ?? '';
    out.displayName = sessionUser.displayName || sessionUser.username || '';
    out.avatarUrl = discordAvatarUrl(sessionUser.id, sessionUser.avatar);
  } else if (sessionUser.provider === 'super-admin') {
    out.firstName = sessionUser.firstName ?? '';
    out.lastName = sessionUser.lastName ?? '';
    out.displayName = sessionUser.displayName || sessionUser.username || '';
  }

  const fn = String(out.firstName || '').trim();
  const ln = String(out.lastName || '').trim();
  const dn = String(out.displayName || '').trim();
  if (fn && ln) {
    out.displayLabel = `${fn} ${ln}`.trim();
  } else if (dn) {
    out.displayLabel = dn;
  } else {
    out.displayLabel = out.username || out.email || 'User';
  }

  out.profileComplete = isProfileComplete(out);
  return out;
}

module.exports = { getMePayload };
