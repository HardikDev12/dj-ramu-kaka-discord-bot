import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Repo root .env (Next only auto-loads files under apps/web/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function stripQuotes(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/^["']|["']$/g, '');
}

const clientId =
  stripQuotes(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID) ||
  stripQuotes(process.env.CLIENT_ID) ||
  '';

const apiInternal =
  stripQuotes(process.env.API_INTERNAL_URL) ||
  stripQuotes(process.env.NEXT_PUBLIC_API_URL) ||
  'http://127.0.0.1:3001';

/** Monorepo root (hoisted `node_modules` lives here) — stabilizes tracing in npm workspaces. */
const monorepoRoot = path.resolve(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: monorepoRoot,
  },
  env: {
    NEXT_PUBLIC_DISCORD_CLIENT_ID: clientId,
  },
  /**
   * Dev-only: disable webpack's persistent pack cache. On Windows (paths with spaces, AV locking),
   * pack rename/stat often fails (ENOENT), which yields missing chunks (e.g. ./592.js) and 500s on
   * /_next/static/* and pages. Slightly slower cold compiles; stable output.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  /**
   * Proxy API auth + playlists through the web origin so session cookies are set for the page
   * host (required when the browser loads the app from WEB_ORIGIN, e.g. localhost:3000).
   * Set DISCORD_REDIRECT_URI to `${WEB_ORIGIN}/auth/discord/callback` so Discord OAuth shares the same cookie jar.
   */
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: `${apiInternal}/auth/:path*` },
      { source: '/data/playlists/:path*', destination: `${apiInternal}/api/playlists/:path*` },
      { source: '/data/playlists', destination: `${apiInternal}/api/playlists` },
      { source: '/data/user/guilds', destination: `${apiInternal}/api/user/guilds` },
      { source: '/data/user/profile', destination: `${apiInternal}/api/user/profile` },
      { source: '/data/admin/:path*', destination: `${apiInternal}/api/admin/:path*` },
    ];
  },
};

export default nextConfig;
