const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawn } = require('node:child_process');

const envPath = resolve(__dirname, '..', '.env.docker');
const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.error('Usage: node scripts/with-env-docker.cjs <command> [...args]');
  process.exit(1);
}

const env = { ...process.env };

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^"(.*)"$/, '$1');

    if (!env[key]) {
      env[key] = value;
    }
  }
}

const executable =
  command === 'prisma'
    ? process.execPath
    : process.platform === 'win32' && !/\.(cmd|exe|bat)$/i.test(command)
      ? `${command}.cmd`
      : command;

const spawnArgs =
  command === 'prisma'
    ? [require.resolve('prisma/build/index.js', { paths: [process.cwd()] }), ...args]
    : args;

const child = spawn(executable, spawnArgs, {
  env,
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Command terminated by signal ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 0);
});
