const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const dir = path.resolve(__dirname, '../services/lavalink');
const jar = path.join(dir, 'Lavalink.jar');

if (!fs.existsSync(jar)) {
  console.error(
    '[lavalink] Missing services/lavalink/Lavalink.jar\n' +
      'Download from https://github.com/lavalink-devs/Lavalink/releases/latest (Assets → Lavalink.jar)'
  );
  process.exit(1);
}

function resolveJavaExecutable() {
  if (process.env.JAVA_HOME) {
    const name = process.platform === 'win32' ? 'java.exe' : 'java';
    const exe = path.join(process.env.JAVA_HOME, 'bin', name);
    if (fs.existsSync(exe)) return exe;
  }
  return process.platform === 'win32' ? 'java.exe' : 'java';
}

/** @returns {number} major version, 0 if unknown */
function getJavaMajor(javaExe) {
  const r = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const out = `${r.stderr || ''}${r.stdout || ''}`;
  const legacy = out.match(/version "1\.(\d+)\./);
  if (legacy) return parseInt(legacy[1], 10);
  const modern = out.match(/version "?(\d+)\./);
  if (modern) return parseInt(modern[1], 10);
  return 0;
}

const javaExe = resolveJavaExecutable();
const major = getJavaMajor(javaExe);

if (major < 17) {
  console.error(
    '[lavalink] Lavalink 4 needs Java 17 or newer. Your `java -version` looks like major version:',
    major || 'unknown'
  );
  console.error(
    'Install JDK 17+ (https://adoptium.net/) and either:\n' +
      '  • Put it first on PATH, or\n' +
      '  • Set JAVA_HOME to the JDK folder (e.g. C:\\\\Program Files\\\\Eclipse Adoptium\\\\jdk-21...)'
  );
  process.exit(1);
}

const child = spawn(javaExe, ['-jar', jar], {
  cwd: dir,
  stdio: 'inherit',
  shell: false,
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
