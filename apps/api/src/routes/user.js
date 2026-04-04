const express = require('express');
const { User, mongoose } = require('@music-bot/db');
const { requireUser } = require('../middleware/auth');
const { AppError } = require('../lib/app-error');
const { getMePayload } = require('../lib/me');
const { isProfileComplete, trimStr, isMongoId } = require('../lib/profile');

const router = express.Router();
const MANAGE_GUILD = 0x20n;
const BOT_GUILDS_CACHE_TTL_MS = 30 * 1000;
const USER_GUILDS_CACHE_TTL_MS = 5 * 1000;
const MAX_RETRIES = 2;

/** @type {{ expiresAt: number, guilds: any[] } | null} */
let botGuildsCache = null;
/** @type {Map<string, { expiresAt: number, guilds: any[] }>} */
const userGuildsCache = new Map();

function requireMongo() {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError(503, 'DB_UNAVAILABLE', 'Database is not connected. Set MONGO_URI and restart the API.');
  }
}

function hasManageGuild(permissions) {
  try {
    const bits = BigInt(String(permissions || '0'));
    return (bits & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}

async function fetchGuildsOnce(token, tokenType = 'Bearer') {
  const res = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `${tokenType} ${token}` },
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const retryAfterSeconds = Number(body?.retry_after || 0.5);
    return { ok: false, rateLimited: true, retryAfterMs: Math.max(100, Math.ceil(retryAfterSeconds * 1000)) };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, rateLimited: false, status: res.status, bodyText: text };
  }

  const guilds = await res.json().catch(() => []);
  return { ok: true, guilds: Array.isArray(guilds) ? guilds : [] };
}

async function fetchDiscordGuildsWithRetry(token, tokenType = 'Bearer', maxRetries = MAX_RETRIES) {
  let attempt = 0;
  let waitMs = 0;

  while (attempt <= maxRetries) {
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    const result = await fetchGuildsOnce(token, tokenType);
    if (result.ok) return result.guilds;

    if (result.rateLimited) {
      attempt += 1;
      waitMs = result.retryAfterMs;
      continue;
    }

    throw new AppError(
      502,
      'DISCORD_API',
      `Discord guild lookup failed (${result.status}): ${result.bodyText}`
    );
  }

  throw new AppError(429, 'DISCORD_RATE_LIMITED', 'Discord is rate limiting guild lookups. Please retry shortly.');
}

function readCache(cacheValue) {
  if (!cacheValue) return null;
  if (cacheValue.expiresAt <= Date.now()) return null;
  return cacheValue.guilds;
}

function writeUserCache(userId, guilds) {
  userGuildsCache.set(userId, {
    guilds,
    expiresAt: Date.now() + USER_GUILDS_CACHE_TTL_MS,
  });
}

router.get('/guilds', requireUser, async (req, res, next) => {
  try {
    const sessionUser = req.session?.user || {};
    const provider = sessionUser.provider;

    if (provider === 'local') {
      requireMongo();
      const account = await User.findById(sessionUser.id).select({ discord: 1 }).lean();
      if (!account?.discord?.userId) {
        throw new AppError(
          403,
          'DISCORD_LINK_REQUIRED',
          'No Discord account is configured for this user yet. Connect Discord to load servers.'
        );
      }
    } else if (provider !== 'discord') {
      throw new AppError(403, 'DISCORD_LINK_REQUIRED', 'Connect Discord to load servers.');
    }

    const accessToken = req.session?.discord?.accessToken;
    const tokenType = req.session?.discord?.tokenType || 'Bearer';
    if (!accessToken) {
      throw new AppError(
        401,
        'DISCORD_TOKEN_MISSING',
        'Discord session expired or missing. Reconnect Discord to load servers.'
      );
    }

    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken) {
      throw new AppError(500, 'BOT_TOKEN_MISSING', 'DISCORD_TOKEN is not configured on API.');
    }

    const userId = req.session?.user?.id || 'unknown';

    const cachedUserGuilds = readCache(userGuildsCache.get(userId));
    const cachedBotGuilds = readCache(botGuildsCache);

    const userGuildsPromise = cachedUserGuilds
      ? Promise.resolve(cachedUserGuilds)
      : fetchDiscordGuildsWithRetry(accessToken, tokenType);
    const botGuildsPromise = cachedBotGuilds
      ? Promise.resolve(cachedBotGuilds)
      : fetchDiscordGuildsWithRetry(botToken, 'Bot');

    const [userGuilds, botGuilds] = await Promise.all([userGuildsPromise, botGuildsPromise]);

    if (!cachedUserGuilds) {
      writeUserCache(userId, userGuilds);
    }
    if (!cachedBotGuilds) {
      botGuildsCache = {
        guilds: botGuilds,
        expiresAt: Date.now() + BOT_GUILDS_CACHE_TTL_MS,
      };
    }

    const botGuildIds = new Set((botGuilds || []).map((g) => g.id));
    const guilds = (userGuilds || [])
      .filter((g) => hasManageGuild(g.permissions))
      .filter((g) => botGuildIds.has(g.id))
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        permissions: g.permissions,
        owner: !!g.owner,
      }));

    res.json({ success: true, guilds });
  } catch (e) {
    console.error('[GET /api/user/guilds]', e.message);
    next(e);
  }
});

router.patch('/profile', requireUser, async (req, res, next) => {
  try {
    const su = req.session.user;
    const { firstName, lastName, displayName } = req.body || {};
    let fn = trimStr(firstName || '');
    let ln = trimStr(lastName || '');
    let dn = trimStr(displayName || '');
    if (fn && ln) {
      dn = `${fn} ${ln}`.trim().slice(0, 80);
    }
    if (!isProfileComplete({ firstName: fn, lastName: ln, displayName: dn })) {
      throw new AppError(
        400,
        'PROFILE_INCOMPLETE',
        'Provide first and last name, or a display name of at least 2 characters.'
      );
    }

    if (su.provider === 'local' && isMongoId(su.id)) {
      requireMongo();
      await User.findByIdAndUpdate(su.id, {
        $set: { firstName: fn, lastName: ln, displayName: dn },
      });
      req.session.user = {
        ...su,
        firstName: fn,
        lastName: ln,
        displayName: dn,
        username: dn || su.username,
      };
    } else if (su.provider === 'discord') {
      req.session.user = {
        ...su,
        firstName: fn,
        lastName: ln,
        displayName: dn,
        username: dn || su.username,
      };
    } else if (su.provider === 'super-admin') {
      req.session.user = {
        ...su,
        firstName: fn,
        lastName: ln,
        displayName: dn,
        username: dn || su.username,
      };
    } else {
      throw new AppError(400, 'UNSUPPORTED', 'Cannot update profile for this account type.');
    }

    const payload = await getMePayload(req);
    res.json({ user: payload });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
