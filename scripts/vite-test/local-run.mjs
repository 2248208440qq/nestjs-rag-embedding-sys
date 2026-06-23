import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const node = process.execPath;
const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
const timeoutMs = Number(process.env.API_TEST_TIMEOUT_MS ?? 30_000);

let backendProcess;

try {
  await run(pnpm, ['docker:up']);
  await run(pnpm, ['backend:db:push']);

  if (!(await isBackendReady())) {
    backendProcess = startBackend();
  }

  await waitForBackend();
  await run(node, ['scripts/vite-test/run.mjs'], {
    env: {
      ...process.env,
      API_BASE_URL: baseUrl,
      API_TEST_TIMEOUT_MS: String(timeoutMs),
    },
  });
} finally {
  await stopBackend();
}

function startBackend() {
  console.log('\nStarting local backend...');

  const child = spawnCommand(pnpm, ['--filter', 'backend', 'dev'], {
    cwd: rootDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(prefixLines('backend', chunk));
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(prefixLines('backend', chunk));
  });

  return child;
}

async function stopBackend() {
  if (!backendProcess || backendProcess.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    await run('taskkill', ['/pid', String(backendProcess.pid), '/T', '/F'], {
      allowFailure: true,
      silent: true,
    });
    return;
  }

  backendProcess.kill('SIGTERM');
}

async function waitForBackend() {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isBackendReady()) {
      return;
    }

    await delay(500);
  }

  throw new Error(`Backend at ${baseUrl} was not ready within ${timeoutMs}ms`);
}

async function isBackendReady() {
  try {
    const response = await fetch(new URL('/', baseUrl));
    return response.ok;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  if (!options.silent) {
    console.log(`\n> ${command} ${args.join(' ')}`);
  }

  return new Promise((resolve, reject) => {
    const child = spawnCommand(command, args, {
      cwd: rootDir,
      env: options.env ?? process.env,
      stdio: options.silent ? 'ignore' : 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0 || options.allowFailure) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function spawnCommand(command, args, options) {
  if (process.platform !== 'win32') {
    return spawn(command, args, options);
  }

  return spawn([command, ...args].map(quoteShellArg).join(' '), [], {
    ...options,
    shell: true,
  });
}

function quoteShellArg(value) {
  if (/^[\w:./\\-]+$/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '\\"')}"`;
}

function prefixLines(label, chunk) {
  return String(chunk)
    .split(/(\r?\n)/)
    .map((part) => {
      if (part === '\n' || part === '\r\n' || part.length === 0) {
        return part;
      }

      return `[${label}] ${part}`;
    })
    .join('');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
