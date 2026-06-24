const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:3000';
const baseUrl = process.env.API_BASE_URL ?? `${apiOrigin}/api`;
const docsJsonUrl = process.env.DOCS_JSON_URL ?? `${apiOrigin}/docs-json`;
const timeoutMs = Number(process.env.API_TEST_TIMEOUT_MS ?? 15_000);
const mode = resolveMode(process.argv);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: pnpm test:api [--api-only|--docs-only]

Environment:
  API_ORIGIN             Backend or Vite proxy origin. Default: http://localhost:3000
  API_BASE_URL           Backend API base URL. Default: $API_ORIGIN/api
  DOCS_JSON_URL          Swagger JSON URL. Default: $API_ORIGIN/docs-json
  API_TEST_TIMEOUT_MS    Backend readiness timeout. Default: 15000

Examples:
  pnpm test:api
  pnpm test:api --api-only
  pnpm test:docs
  API_ORIGIN=http://localhost:5777 pnpm test:api`);
  process.exit(0);
}

const apiTests = [
  {
    name: 'GET / returns wrapped success response',
    method: 'GET',
    path: '/',
    expectStatus: 200,
    assert: (body) => {
      expectEqual(body.code, 0, 'code');
      expectEqual(body.message, 'success', 'message');
      expectEqual(body.data, 'Hello World!', 'data');
      expectEqual(body.path, '/api/', 'path');
      expectType(body.timestamp, 'string', 'timestamp');
      expectType(body.requestId, 'string', 'requestId');
    },
  },
  {
    name: 'GET /health returns health payload',
    method: 'GET',
    path: '/health',
    expectStatus: 200,
    assert: (body) => {
      expectEqual(body.code, 0, 'code');
      expectTruthy(body.data, 'data');
      expectEqual(body.path, '/api/health', 'path');
    },
  },
  {
    name: 'POST /auth/login rejects invalid credentials without whitelist errors',
    method: 'POST',
    path: '/auth/login',
    body: {
      captcha: true,
      password: 'wrong-password',
      username: 'admin',
    },
    expectStatus: 401,
    raw: true,
    assert: (body) => {
      expectEqual(body.code, 401, 'code');
      expectEqual(body.errorCode, 'UNAUTHORIZED', 'errorCode');
      expectEqual(body.message, 'Username or password is incorrect', 'message');
      expectEqual(body.path, '/api/auth/login', 'path');
      expectEqual(body.method, 'POST', 'method');
    },
  },
  {
    name: 'POST /auth/logout rejects missing token once',
    method: 'POST',
    path: '/auth/logout',
    expectStatus: 401,
    raw: true,
    assert: (body) => {
      expectEqual(body.code, 401, 'code');
      expectEqual(body.errorCode, 'UNAUTHORIZED', 'errorCode');
      expectEqual(body.message, 'No token provided', 'message');
      expectEqual(body.path, '/api/auth/logout', 'path');
      expectEqual(body.method, 'POST', 'method');
    },
  },
  {
    name: 'GET /auth/codes rejects missing token',
    method: 'GET',
    path: '/auth/codes',
    expectStatus: 401,
    raw: true,
    assert: (body) => {
      expectEqual(body.code, 401, 'code');
      expectEqual(body.errorCode, 'UNAUTHORIZED', 'errorCode');
      expectEqual(body.message, 'No token provided', 'message');
      expectEqual(body.path, '/api/auth/codes', 'path');
    },
  },
];

const docsTests = [
  {
    name: 'GET Swagger JSON exposes current system docs',
    method: 'GET',
    url: docsJsonUrl,
    expectStatus: 200,
    raw: true,
    assert: (body) => {
      expectEqual(body.info?.title, 'rag-embedding', 'info.title');
      expectTruthy(body.paths?.['/api/auth/login'], 'paths./api/auth/login');
      expectTruthy(body.paths?.['/api/search'], 'paths./api/search');
      expectTruthy(body.components?.schemas, 'components.schemas');
    },
  },
];

async function main() {
  await waitForBackend();

  const tests = [
    ...(mode === 'docs' ? [] : apiTests),
    ...(mode === 'api' ? [] : docsTests),
  ];
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
      const response = await fetch(apiUrl('/'));

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
  const response = await fetch(test.url ?? apiUrl(test.path), {
    method: test.method,
    headers: {
      accept: 'application/json',
      ...(test.body ? { 'content-type': 'application/json' } : {}),
      'x-request-id': `vite-test-${Date.now()}`,
    },
    body: test.body ? JSON.stringify(test.body) : undefined,
  });
  const body = await readJson(response);

  expectEqual(response.status, test.expectStatus, 'HTTP status');
  test.assert(body);
}

function printResults(results) {
  console.log(`\nAPI test target: ${baseUrl}`);
  console.log(`Docs target: ${docsJsonUrl}`);

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

async function readJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON response, got: ${text.slice(0, 200)}`);
  }
}

function resolveMode(argv) {
  if (argv.includes('--docs-only')) return 'docs';
  if (argv.includes('--api-only')) return 'api';
  return 'all';
}

function apiUrl(path) {
  return `${baseUrl.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
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
