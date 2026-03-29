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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_DISCORD_CLIENT_ID: clientId,
  },
};

export default nextConfig;
