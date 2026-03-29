const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const dir = path.resolve(__dirname, '../services/lavalink');
const jar = path.join(dir, 'Lavalink.jar');

if (!fs.existsSync(jar)) {
  console.error(
    '[lavalink] Missing services/lavalink/Lavalink.jar\n' +
      'Download from https://github.com/lavalink-devs/Lavalink/releases/latest (Assets → Lavalink.jar)'
  );
  process.exit(1);
}

const java = process.platform === 'win32' ? 'java.exe' : 'java';
const child = spawn(java, ['-jar', jar], {
  cwd: dir,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('[lavalink] Failed to start Java:', err.message);
  console.error('Install JDK 17+ and ensure `java` is on your PATH (https://adoptium.net/)');
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
