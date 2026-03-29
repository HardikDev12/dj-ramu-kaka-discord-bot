const crypto = require('crypto');
const express = require('express');
const { AppError } = require('../lib/app-error');

const router = express.Router();

function sanitizeNext(nextPath) {
  if (!nextPath || typeof nextPath !== 'string') return '/';
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) return '/';
  return nextPath;
}

function requireOAuthConfig() {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError(
      500,
      'OAUTH_NOT_CONFIGURED',
      'CLIENT_ID, CLIENT_SECRET, and DISCORD_REDIRECT_URI must be set'
    );
  }
  return { clientId, clientSecret, redirectUri };
}

/**
 * @param {string} code
 * @param {string} redirectUri
 */
async function exchangeDiscordCode(code, redirectUri) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn('[auth] token exchange failed', res.status, text);
    throw new AppError(400, 'OAUTH_TOKEN', 'Discord token exchange failed');
  }

  return res.json();
}

/** @param {string} accessToken */
async function fetchDiscordMe(accessToken) {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new AppError(400, 'OAUTH_USER', 'Could not load Discord profile');
  }
  return res.json();
}

router.get('/discord', (req, res, next) => {
  try {
    const { clientId, redirectUri } = requireOAuthConfig();
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    req.session.postLoginNext = sanitizeNext(
      typeof req.query.next === 'string' ? req.query.next : '/'
    );

    const authorize = new URL('https://discord.com/api/oauth2/authorize');
    authorize.searchParams.set('client_id', clientId);
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('scope', 'identify');
    authorize.searchParams.set('state', state);

    res.redirect(authorize.toString());
  } catch (e) {
    next(e);
  }
});

router.get('/discord/callback', async (req, res, next) => {
  try {
    const { redirectUri } = requireOAuthConfig();
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'OAUTH_CODE', 'Missing authorization code');
    }
    if (!state || typeof state !== 'string' || state !== req.session.oauthState) {
      throw new AppError(400, 'OAUTH_STATE', 'Invalid OAuth state');
    }

    delete req.session.oauthState;

    const tokenPayload = await exchangeDiscordCode(code, redirectUri);
    const accessToken = tokenPayload.access_token;
    if (!accessToken) {
      throw new AppError(400, 'OAUTH_TOKEN', 'No access token from Discord');
    }

    const me = await fetchDiscordMe(accessToken);
    req.session.user = {
      id: me.id,
      username: me.username,
      discriminator: me.discriminator,
      avatar: me.avatar,
    };

    const nextPath = req.session.postLoginNext || '/';
    delete req.session.postLoginNext;

    const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
    res.redirect(`${webOrigin}${nextPath}`);
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const user = req.session?.user;
  if (!user?.id) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Not signed in' },
    });
  }
  res.json({ user });
});

module.exports = router;
