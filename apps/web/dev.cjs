const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Stale `.next` (e.g. after `next build`, interrupted compile, or mixed dev/prod chunks) causes
 * `TypeError: e[o] is not a function` in webpack-runtime and 500s on `/_next/static/*`.
 * Wipe before dev unless NEXT_DEV_NO_CLEAN=1.
 */
if (process.env.NEXT_DEV_NO_CLEAN !== '1') {
  const nextDir = path.join(__dirname, '.next');
  const localCache = path.join(__dirname, 'node_modules', '.cache');
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('[web] Cleared .next for dev (set NEXT_DEV_NO_CLEAN=1 to skip).');
  } catch {
    /* ignore */
  }
  try {
    if (fs.existsSync(localCache)) {
      fs.rmSync(localCache, { recursive: true, force: true });
      console.log('[web] Cleared apps/web/node_modules/.cache');
    }
  } catch {
    /* ignore */
  }
}

const port = process.env.WEB_PORT || '3000';
const nextBin = require.resolve('next/dist/bin/next', { paths: [__dirname] });
const devArgs = [nextBin, 'dev', '-p', port];
// Turbopack avoids webpack's numbered chunks (e.g. ./135.js) and pack-cache corruption on Windows.
// Set NEXT_DEV_NO_TURBO=1 to use webpack dev (e.g. debugging webpack-only issues).
if (process.env.NEXT_DEV_NO_TURBO !== '1') {
  devArgs.push('--turbo');
  console.log('[web] dev: Turbopack (--turbo). Set NEXT_DEV_NO_TURBO=1 to use webpack (can break on Windows).');
} else {
  console.warn('[web] dev: webpack (NEXT_DEV_NO_TURBO=1) â€” if you see MODULE_NOT_FOUND ./NNN.js, remove it and use Turbopack.');
}

const child = spawn(process.execPath, devArgs, {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

