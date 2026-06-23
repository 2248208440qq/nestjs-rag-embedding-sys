const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
const timeoutMs = Number(process.env.API_TEST_TIMEOUT_MS ?? 15_000);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: pnpm test:api

Environment:
  API_BASE_URL          Backend base URL. Default: http://localhost:3000
  API_TEST_TIMEOUT_MS   Backend readiness timeout. Default: 15000

Examples:
  pnpm test:api
  API_BASE_URL=http://localhost:3000 pnpm test:api`);
  process.exit(0);
}

const tests = [
  {
    name: 'GET / returns wrapped success response',
    method: 'GET',
    path: '/',
    expectStatus: 200,
    assert: (body) => {
      expectEqual(body.code, 0, 'code');
      expectEqual(body.message, 'success', 'message');
      expectEqual(body.data, 'Hello World!', 'data');
      expectEqual(body.path, '/', 'path');
      expectType(body.timestamp, 'string', 'timestamp');
      expectType(body.requestId, 'string', 'requestId');
    },
  },
  {
    name: 'GET /docs-json exposes Swagger document',
    method: 'GET',
    path: '/docs-json',
    expectStatus: 200,
    raw: true,
    assert: (body) => {
      expectEqual(body.info?.title, 'nest-ai-template', 'info.title');
      expectTruthy(body.paths?.['/users'], 'paths./users');
    },
  },
  {
    name: 'GET /users returns wrapped user list',
    method: 'GET',
    path: '/users',
    expectStatus: 200,
    assert: (body) => {
      expectEqual(body.code, 0, 'code');
      expectTruthy(Array.isArray(body.data), 'data must be an array');
    },
  },
  {
    name: 'GET /users/not-found returns wrapped error response',
    method: 'GET',
    path: '/users/not-found',
    expectStatus: 404,
    raw: true,
    assert: (body) => {
      expectEqual(body.code, 404, 'code');
      expectEqual(body.errorCode, 'NOT_FOUND', 'errorCode');
      expectEqual(body.path, '/users/not-found', 'path');
      expectEqual(body.method, 'GET', 'method');
      expectType(body.timestamp, 'string', 'timestamp');
      expectType(body.requestId, 'string', 'requestId');
    },
  },
];

async function main() {
  await waitForBackend();

  const results = [];

  for (const test of tests) {
    const startedAt = Date.now();

    try {
      await runTest(test);
      results.push({ name: test.name, ok: true, durationMs: Date.now() - startedAt });
    } catch (error) {
      results.push({
        name: test.name,
        ok: false,
        durationMs: Date.now() - startedAt,
        error,
      });
    }
  }

  printResults(results);

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

async function waitForBackend() {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL('/', baseUrl));

      if (response.ok) {
        return;
      }

      lastError = new Error(`Backend returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(
    `Backend at ${baseUrl} was not ready within ${timeoutMs}ms: ${formatError(lastError)}`,
  );
}

async function runTest(test) {
  const response = await fetch(new URL(test.path, baseUrl), {
    method: test.method,
    headers: {
      accept: 'application/json',
      'x-request-id': `vite-test-${Date.now()}`,
    },
  });
  const body = await response.json();

  expectEqual(response.status, test.expectStatus, 'HTTP status');
  test.assert(body);
}

function printResults(results) {
  console.log(`\nAPI test target: ${baseUrl}`);

  for (const result of results) {
    const status = result.ok ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.name} (${result.durationMs}ms)`);

    if (!result.ok) {
      console.log(`     ${formatError(result.error)}`);
    }
  }

  const passed = results.filter((result) => result.ok).length;
  console.log(`\n${passed}/${results.length} tests passed`);
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function expectType(value, expectedType, label) {
  if (typeof value !== expectedType) {
    throw new Error(`${label}: expected type ${expectedType}, got ${typeof value}`);
  }
}

function expectTruthy(value, label) {
  if (!value) {
    throw new Error(`${label}: expected truthy value`);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

await main();
