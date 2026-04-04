/**
 * Profile is complete if both first + last are set, OR a display name (≥2 chars) is set
 * (matches registration: first+last OR legacy single name).
 */
function isProfileComplete(u) {
  if (!u || typeof u !== 'object') return false;
  const fn = String(u.firstName || '').trim();
  const ln = String(u.lastName || '').trim();
  const dn = String(u.displayName || '').trim();
  if (fn.length > 0 && ln.length > 0) return true;
  if (dn.length >= 2) return true;
  return false;
}

function discordAvatarUrl(userId, avatarHash, size = 64) {
  if (!userId || !avatarHash) return null;
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=${size}`;
}

function trimStr(v, max = 80) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function isMongoId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

module.exports = {
  isProfileComplete,
  discordAvatarUrl,
  trimStr,
  isMongoId,
};
