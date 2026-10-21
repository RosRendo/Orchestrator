const { spawn } = require('child_process');
const path = require('path');

const isDev = process.argv.includes('--dev');
const isWin = process.platform === 'win32';

// In cloud deployment (Railway/Render/Fly.io), PORT is assigned dynamically (e.g. 80, 8080, 3000)
const PUBLIC_PORT = process.env.PORT || 3000;
const INTERNAL_BACKEND_PORT = process.env.BACKEND_PORT || 3005;

console.log('========================================================');
console.log(`  RendoOS Unified Fullstack Runner (${isDev ? 'DEVELOPMENT' : 'PRODUCTION'})`);
console.log('========================================================');
console.log(`  🌐 Public Entrypoint:        http://0.0.0.0:${PUBLIC_PORT}`);
console.log(`  ⚙️  Internal Backend Port:    ${INTERNAL_BACKEND_PORT}`);
console.log('--------------------------------------------------------\n');

const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

// 1. Launch Backend (NestJS)
const backendArgs = isDev ? ['run', 'start:dev'] : ['dist/main.js'];
const backendExecutable = isDev ? npmCmd : 'node';

console.log(`[RendoOS] Spawning Backend on internal port ${INTERNAL_BACKEND_PORT}...`);
const backend = spawn(backendExecutable, backendArgs, {
  cwd: path.join(__dirname, 'backend'),
  env: {
    ...process.env,
    PORT: String(INTERNAL_BACKEND_PORT),
  },
  stdio: 'inherit',
  shell: isWin,
});

backend.on('error', (err) => {
  console.error('[RendoOS Backend Process Error]:', err);
});

// 2. Launch Frontend (Next.js)
const frontendArgs = isDev
  ? ['run', 'dev', '--', '-p', String(PUBLIC_PORT)]
  : ['next', 'start', '-p', String(PUBLIC_PORT), '-H', '0.0.0.0'];
const frontendExecutable = isDev ? npmCmd : npxCmd;

console.log(`[RendoOS] Spawning Frontend on public port ${PUBLIC_PORT}...`);
const frontend = spawn(frontendExecutable, frontendArgs, {
  cwd: path.join(__dirname, 'frontend'),
  env: {
    ...process.env,
    PORT: String(PUBLIC_PORT),
    BACKEND_INTERNAL_URL: `http://127.0.0.1:${INTERNAL_BACKEND_PORT}`,
  },
  stdio: 'inherit',
  shell: isWin,
});

frontend.on('error', (err) => {
  console.error('[RendoOS Frontend Process Error]:', err);
});

// Graceful Termination
let terminated = false;
const shutdown = (signal) => {
  if (terminated) return;
  terminated = true;
  console.log(`\n[RendoOS] Received ${signal}. Gracefully stopping all processes...`);
  try {
    if (backend && !backend.killed) backend.kill('SIGTERM');
  } catch {}
  try {
    if (frontend && !frontend.killed) frontend.kill('SIGTERM');
  } catch {}
  setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', () => shutdown('exit'));
