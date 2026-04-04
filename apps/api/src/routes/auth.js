const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const express = require('express');
const { User, mongoose } = require('@music-bot/db');
const { AppError } = require('../lib/app-error');
const { decryptValue, normalizeEmail, superAdminEmail, resolveUserRole } = require('../lib/roles');
const { trimStr } = require('../lib/profile');
const { getMePayload } = require('../lib/me');

const router = express.Router();
const SUPER_ADMIN_EMAIL_ENC = '5Chq1yrBtdDcHG3J:vdH56txOk18lmPAcfcc9nw==:vb/ZHonHOpHDO0Fvxj9rYXFubfNJ'; // 17@gmail.com
const SUPER_ADMIN_PASS_ENC = 'RQk84M/FMC1ZTbF9:qh6W+jYp4IwDsy+4pImSwg==:XW5Qha0cIwG8ZqHC'; //@01

function requireMongo() {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError(503, 'DB_UNAVAILABLE', 'Database is not connected. Set MONGO_URI and restart the API.');
  }
}

function sanitizeNext(nextPath) {
  if (!nextPath || typeof nextPath !== 'string') return '/';
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) return '/';
  return nextPath;
}

function isSuperAdminLogin(email, password) {
  try {
    const expectedEmail = normalizeEmail(decryptValue(SUPER_ADMIN_EMAIL_ENC));
    const expectedPassword = decryptValue(SUPER_ADMIN_PASS_ENC);
    return normalizeEmail(email) === expectedEmail && String(password || '') === expectedPassword;
  } catch {
    return false;
  }
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
    req.session.discordLinkUserId = req.session?.user?.provider === 'local' ? req.session?.user?.id : null;
    req.session.postLoginNext = sanitizeNext(
      typeof req.query.next === 'string' ? req.query.next : '/'
    );

    const authorize = new URL('https://discord.com/api/oauth2/authorize');
    authorize.searchParams.set('client_id', clientId);
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('scope', 'identify guilds');
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
    req.session.discord = {
      accessToken,
      tokenType: tokenPayload.token_type || 'Bearer',
      refreshToken: tokenPayload.refresh_token || null,
      expiresIn: tokenPayload.expires_in || null,
      scope: tokenPayload.scope || 'identify guilds',
    };

    const me = await fetchDiscordMe(accessToken);
    const linkUserId = typeof req.session.discordLinkUserId === 'string' ? req.session.discordLinkUserId : '';
    delete req.session.discordLinkUserId;

    if (linkUserId) {
      requireMongo();
      await User.findByIdAndUpdate(linkUserId, {
        $set: {
          discord: {
            userId: String(me.id || ''),
            username: String(me.username || ''),
            avatar: String(me.avatar || ''),
            linkedAt: new Date(),
          },
        },
      });
    }

    const displayName = String(me.global_name || me.username || '')
      .trim()
      .slice(0, 80);
    const discordUser = {
      id: me.id,
      username: me.username,
      global_name: me.global_name || '',
      discriminator: me.discriminator,
      avatar: me.avatar,
      provider: 'discord',
      role: 'user',
      firstName: '',
      lastName: '',
      displayName,
    };
    if (!linkUserId) {
      req.session.user = { ...discordUser, role: resolveUserRole(discordUser) };
    }

    const nextPath = req.session.postLoginNext || '/';
    delete req.session.postLoginNext;

    const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
    res.redirect(`${webOrigin}${nextPath}`);
  } catch (e) {
    next(e);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    requireMongo();
    const { email, password, name, firstName, lastName } = req.body || {};
    const em = normalizeEmail(email);
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      throw new AppError(400, 'INVALID_EMAIL', 'A valid email is required');
    }
    if (typeof password !== 'string' || password.length < 8) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Password must be at least 8 characters');
    }
    if (em === superAdminEmail()) {
      throw new AppError(403, 'RESERVED_EMAIL', 'This email is reserved for super admin');
    }
    const existing = await User.findOne({ email: em });
    if (existing) {
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }
    const fn = trimStr(firstName || '');
    const ln = trimStr(lastName || '');
    const legacy = trimStr(name || '');
    if (!((fn && ln) || legacy.length >= 2)) {
      throw new AppError(
        400,
        'PROFILE_REQUIRED',
        'First and last name are required, or a display name of at least 2 characters.'
      );
    }
    let displayName;
    let firstNameOut;
    let lastNameOut;
    if (fn && ln) {
      firstNameOut = fn;
      lastNameOut = ln;
      displayName = `${fn} ${ln}`.trim().slice(0, 80);
    } else {
      firstNameOut = '';
      lastNameOut = '';
      displayName = legacy.slice(0, 80);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: em,
      passwordHash,
      firstName: firstNameOut,
      lastName: lastNameOut,
      displayName,
    });
    const newUser = {
      id: user._id.toString(),
      email: user.email,
      username: displayName || user.email.split('@')[0],
      provider: 'local',
      role: 'user',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: user.displayName || '',
    };
    req.session.user = { ...newUser, role: resolveUserRole(newUser) };
    const payload = await getMePayload(req);
    res.status(201).json({ user: payload });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const em = normalizeEmail(email);
    if (!em || typeof password !== 'string') {
      throw new AppError(400, 'INVALID', 'Email and password are required');
    }

    if (isSuperAdminLogin(em, password)) {
      const sa = {
        id: 'super-admin',
        email: em,
        username: 'Super Admin',
        provider: 'super-admin',
        role: 'super_admin',
        firstName: '',
        lastName: '',
        displayName: 'Super Admin',
      };
      req.session.user = { ...sa, role: resolveUserRole(sa) };
      const saPayload = await getMePayload(req);
      return res.json({ user: saPayload });
    }

    requireMongo();
    const user = await User.findOne({ email: em });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    const localUser = {
      id: user._id.toString(),
      email: user.email,
      username: user.displayName || user.email.split('@')[0],
      provider: 'local',
      role: 'user',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: user.displayName || '',
    };
    req.session.user = { ...localUser, role: resolveUserRole(localUser) };
    const payload = await getMePayload(req);
    res.json({ user: payload });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get('/me', async (req, res, next) => {
  try {
    const out = await getMePayload(req);
    if (!out) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Not signed in' },
      });
    }
    if (out.role !== req.session.user.role) {
      req.session.user = { ...req.session.user, role: out.role };
    }
    res.json({ user: out });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
