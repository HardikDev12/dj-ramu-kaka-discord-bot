const crypto = require('crypto');

const SUPER_ADMIN_KEY = 'djrk-super-admin-v1';
const SUPER_ADMIN_EMAIL_ENC =
  '5Chq1yrBtdDcHG3J:vdH56txOk18lmPAcfcc9nw==:vb/ZHonHOpHDO0Fvxj9rYXFubfNJ';

function normalizeEmail(e) {
  return typeof e === 'string' ? e.trim().toLowerCase() : '';
}

function decryptValue(encValue) {
  const [ivB64, tagB64, dataB64] = String(encValue || '').split(':');
  if (!ivB64 || !tagB64 || !dataB64) return '';
  const key = crypto.createHash('sha256').update(SUPER_ADMIN_KEY).digest();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString('utf8');
}

function superAdminEmail() {
  const envEmail = normalizeEmail(process.env.SUPER_ADMIN_EMAIL);
  if (envEmail) return envEmail;
  return normalizeEmail(decryptValue(SUPER_ADMIN_EMAIL_ENC));
}

/** Resolve super_admin from session fields + env so /me and UI stay consistent after any login path. */
function resolveUserRole(user) {
  if (!user || typeof user !== 'object') return 'user';
  if (user.role === 'super_admin') return 'super_admin';
  if (user.id === 'super-admin' || user.provider === 'super-admin') return 'super_admin';
  const em = normalizeEmail(user.email);
  if (em && em === superAdminEmail()) return 'super_admin';
  const discordSuperId = String(process.env.SUPER_ADMIN_DISCORD_ID || '').trim();
  if (discordSuperId && String(user.id) === discordSuperId && user.provider === 'discord') {
    return 'super_admin';
  }
  return 'user';
}

module.exports = {
  normalizeEmail,
  decryptValue,
  superAdminEmail,
  resolveUserRole,
};
