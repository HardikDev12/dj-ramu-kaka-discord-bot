/**
 * Discord “Add bot to server” URL (no callback — Discord completes install in the browser).
 * @param {string} clientId Application ID
 * @param {string} [permissions] Bitfield (default: voice + sensible text perms)
 */
export function getDiscordBotInviteUrl(clientId, permissions = '36785152') {
  if (!clientId || !String(clientId).trim()) return null;
  const u = new URL('https://discord.com/oauth2/authorize');
  u.searchParams.set('client_id', String(clientId).trim().replace(/^["']|["']$/g, ''));
  u.searchParams.set('permissions', permissions);
  u.searchParams.set('scope', 'bot applications.commands');
  return u.toString();
}
