const path = require('path');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const port = process.env.WEB_PORT || '3000';
const nextBin = require.resolve('next/dist/bin/next', { paths: [__dirname] });

const child = spawn(process.execPath, [nextBin, 'start', '-p', port], {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
