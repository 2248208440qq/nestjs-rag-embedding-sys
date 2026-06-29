import { randomUUID } from 'node:crypto';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:3000';
const baseUrl = process.env.API_BASE_URL ?? `${apiOrigin}/api`;
const docsJsonUrl = process.env.DOCS_JSON_URL ?? `${apiOrigin}/docs-json`;
const timeoutMs = Number(process.env.API_TEST_TIMEOUT_MS ?? 15_000);
const username = process.env.API_TEST_USERNAME ?? 'admin';
const password = process.env.API_TEST_PASSWORD ?? '123456789';
const runLlmTests = process.env.RUN_LLM_TESTS === 'true';
const options = resolveOptions(process.argv);

if (options.help) {
  console.log(`Usage: pnpm test:api [--api-only|--docs-only] [--module <name>]

Modules:
  auth, app, documents, search, index-jobs, evaluation, knowledge-base, qa, system, docs

Environment:
  API_ORIGIN             Backend or Vite proxy origin. Default: http://localhost:3000
  API_BASE_URL           Backend API base URL. Default: $API_ORIGIN/api
  DOCS_JSON_URL          Swagger JSON URL. Default: $API_ORIGIN/docs-json
  API_TEST_USERNAME      Seeded admin username. Default: admin
  API_TEST_PASSWORD      Seeded admin password. Default: 123456789
  API_TEST_TIMEOUT_MS    Backend readiness timeout. Default: 15000
  RUN_LLM_TESTS          Run structure checks that expect a live LLM path. Default: false

Examples:
  pnpm test:api
  pnpm test:api -- --module qa
  pnpm test:docs
  API_ORIGIN=http://localhost:5777 pnpm test:api
  RUN_LLM_TESTS=true pnpm test:api -- --module qa`);
  process.exit(0);
}

const tests = [
  {
    module: 'app',
    name: 'GET / returns wrapped success response',
    method: 'GET',
    path: '/',
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/');
      expectEqual(body.data, 'Hello World!', 'data');
    },
  },
  {
    module: 'app',
    name: 'GET /health returns health payload',
    method: 'GET',
    path: '/health',
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/health');
      expectTruthy(body.data, 'data');
    },
  },
  {
    module: 'auth',
    name: 'POST /auth/login rejects invalid credentials without whitelist errors',
    method: 'POST',
    path: '/auth/login',
    body: {
      password: 'wrong-password',
      username,
    },
    expectStatus: 401,
    assert: ({ body }) => {
      expectEqual(body.code, 401, 'code');
      expectEqual(body.errorCode, 'UNAUTHORIZED', 'errorCode');
      expectEqual(body.message, 'Username or password is incorrect', 'message');
      expectEqual(body.path, '/api/auth/login', 'path');
      expectEqual(body.method, 'POST', 'method');
    },
  },
  {
    module: 'auth',
    name: 'GET /auth/codes rejects missing token',
    method: 'GET',
    path: '/auth/codes',
    expectStatus: 401,
    assert: ({ body }) => {
      expectEqual(body.code, 401, 'code');
      expectEqual(body.errorCode, 'UNAUTHORIZED', 'errorCode');
      expectEqual(body.message, 'No token provided', 'message');
      expectEqual(body.path, '/api/auth/codes', 'path');
    },
  },
  {
    module: 'auth',
    name: 'POST /auth/login returns access token',
    method: 'POST',
    path: '/auth/login',
    body: () => ({ password, username }),
    expectStatus: 200,
    assert: ({ body, ctx }) => {
      expectSuccess(body, '/api/auth/login');
      expectType(body.data?.accessToken, 'string', 'data.accessToken');
      expectEqual(body.data?.username, username, 'data.username');
      ctx.accessToken = body.data.accessToken;
    },
  },
  {
    module: 'auth',
    name: 'GET /auth/codes returns permission codes',
    method: 'GET',
    path: '/auth/codes',
    auth: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/auth/codes');
      expectArray(body.data, 'data');
    },
  },
  {
    module: 'system',
    name: 'GET /system/user/list returns paginated users',
    method: 'GET',
    path: '/system/user/list?page=1&pageSize=20',
    auth: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body);
      expectCollectionPayload(body.data, 'data');
    },
  },
  {
    module: 'system',
    name: 'GET /system/role/list returns paginated roles',
    method: 'GET',
    path: '/system/role/list?page=1&pageSize=20',
    auth: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body);
      expectCollectionPayload(body.data, 'data');
    },
  },
  {
    module: 'system',
    name: 'GET /system/menu/list returns menu tree',
    method: 'GET',
    path: '/system/menu/list',
    auth: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/system/menu/list');
      expectArray(body.data, 'data');
    },
  },
  {
    module: 'system',
    name: 'GET /system/dept/list returns departments',
    method: 'GET',
    path: '/system/dept/list',
    auth: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/system/dept/list');
      expectArray(body.data, 'data');
    },
  },
  {
    module: 'knowledge-base',
    name: 'POST /knowledge-bases creates a test knowledge base',
    method: 'POST',
    path: '/knowledge-bases',
    auth: true,
    body: ({ ctx }) => {
      ctx.knowledgeBaseCode = `api-test-${Date.now()}-${randomUUID().slice(0, 8)}`;
      return {
        category: 'api-test',
        code: ctx.knowledgeBaseCode,
        description: 'Created by scripts/vite-test.',
        name: `API Test KB ${ctx.knowledgeBaseCode}`,
      };
    },
    expectStatus: 201,
    assert: ({ body, ctx }) => {
      expectSuccess(body, '/api/knowledge-bases');
      expectType(body.data?.id, 'string', 'data.id');
      ctx.knowledgeBaseId = body.data.id;
    },
  },
  {
    module: 'knowledge-base',
    name: 'GET /knowledge-bases lists knowledge bases',
    method: 'GET',
    path: '/knowledge-bases',
    auth: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/knowledge-bases');
      expectArray(body.data, 'data');
    },
  },
  {
    module: 'knowledge-base',
    name: 'GET /knowledge-bases/:id returns detail',
    method: 'GET',
    path: ({ ctx }) => `/knowledge-bases/${ctx.knowledgeBaseId}`,
    auth: true,
    skip: ({ ctx }) => !ctx.knowledgeBaseId,
    expectStatus: 200,
    assert: ({ body, ctx }) => {
      expectSuccess(body, `/api/knowledge-bases/${ctx.knowledgeBaseId}`);
      expectEqual(body.data?.id, ctx.knowledgeBaseId, 'data.id');
    },
  },
  {
    module: 'knowledge-base',
    name: 'PATCH /knowledge-bases/:id updates metadata',
    method: 'PATCH',
    path: ({ ctx }) => `/knowledge-bases/${ctx.knowledgeBaseId}`,
    auth: true,
    skip: ({ ctx }) => !ctx.knowledgeBaseId,
    body: {
      description: 'Updated by scripts/vite-test.',
      status: 'active',
    },
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body);
      expectEqual(body.data?.description, 'Updated by scripts/vite-test.', 'data.description');
    },
  },
  {
    module: 'documents',
    name: 'GET /documents lists documents',
    method: 'GET',
    path: '/documents',
    auth: true,
    expectStatus: 200,
    assert: ({ body, ctx }) => {
      expectSuccess(body, '/api/documents');
      expectArray(body.data, 'data');
      ctx.existingDocumentId = body.data[0]?.id;
    },
  },
  {
    module: 'documents',
    name: 'POST /documents/upload accepts multipart text file',
    method: 'POST',
    path: '/documents/upload',
    auth: true,
    form: () => {
      const form = new FormData();
      const content = '第一条 市场主体应当依法经营。\n第二条 违反规定的，应依法承担责任。';
      form.set('file', new Blob([content], { type: 'text/plain' }), 'api-test-law.txt');
      form.set('title', `API Test Law ${Date.now()}`);
      form.set('sourceType', 'law');
      form.set('tags', 'api-test');
      return form;
    },
    expectStatus: 201,
    assert: ({ body, ctx }) => {
      expectSuccess(body, '/api/documents/upload');
      expectType(body.data?.document?.id, 'string', 'data.document.id');
      ctx.documentId = body.data.document.id;
    },
  },
  {
    module: 'documents',
    name: 'GET /documents/:id returns uploaded detail',
    method: 'GET',
    path: ({ ctx }) => `/documents/${ctx.documentId}`,
    auth: true,
    skip: ({ ctx }) => !ctx.documentId,
    expectStatus: 200,
    assert: ({ body, ctx }) => {
      expectSuccess(body, `/api/documents/${ctx.documentId}`);
      expectEqual(body.data?.id, ctx.documentId, 'data.id');
    },
  },
  {
    module: 'knowledge-base',
    name: 'POST /knowledge-bases/:id/documents binds uploaded document',
    method: 'POST',
    path: ({ ctx }) => `/knowledge-bases/${ctx.knowledgeBaseId}/documents`,
    auth: true,
    skip: ({ ctx }) => !ctx.knowledgeBaseId || !ctx.documentId,
    body: ({ ctx }) => ({ documentIds: [ctx.documentId] }),
    expectStatus: 201,
    assert: ({ body }) => {
      expectSuccess(body);
      expectType(body.data?.id, 'string', 'data.id');
    },
  },
  {
    module: 'documents',
    name: 'POST /documents/:id/extract starts extraction',
    method: 'POST',
    path: ({ ctx }) => `/documents/${ctx.documentId}/extract`,
    auth: true,
    skip: ({ ctx }) => !ctx.documentId,
    expectStatus: 202,
    assert: async ({ body, ctx }) => {
      expectSuccess(body);
      expectType(body.data?.job?.id, 'string', 'data.job.id');
      ctx.extractJobId = body.data.job.id;
      const job = await waitForIndexJob(ctx, ctx.extractJobId);
      expectEqual(job.status, 'succeeded', 'extract job status');
    },
  },
  {
    module: 'documents',
    name: 'POST /documents/:id/index indexes uploaded document or returns controlled boundary',
    method: 'POST',
    path: ({ ctx }) => `/documents/${ctx.documentId}/index`,
    auth: true,
    skip: ({ ctx }) => !ctx.documentId,
    expectStatus: 202,
    assert: async ({ body, ctx }) => {
      expectSuccess(body);
      expectType(body.data?.job?.id, 'string', 'data.job.id');
      ctx.indexJobId = body.data.job.id;
      const job = await waitForIndexJob(ctx, ctx.indexJobId);
      expectEqual(job.status, 'succeeded', 'index job status');
    },
  },
  {
    module: 'search',
    name: 'POST /search returns topK bounded results',
    method: 'POST',
    path: '/search',
    auth: true,
    body: {
      query: '市场',
      topK: 20,
    },
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/search');
      expectEqual(body.data?.query, '市场', 'data.query');
      expectArray(body.data?.results, 'data.results');
      expectAtMost(body.data.results.length, 20, 'data.results.length');
    },
  },
  {
    module: 'search',
    name: 'POST /search supports knowledgeBaseIds filter',
    method: 'POST',
    path: '/search',
    auth: true,
    skip: ({ ctx }) => !ctx.knowledgeBaseId,
    body: ({ ctx }) => ({
      knowledgeBaseIds: [ctx.knowledgeBaseId],
      query: '市场',
      topK: 20,
    }),
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/search');
      expectArray(body.data?.results, 'data.results');
    },
  },
  {
    module: 'index-jobs',
    name: 'GET /index-jobs returns paginated jobs',
    method: 'GET',
    path: '/index-jobs?page=1&pageSize=20',
    auth: true,
    expectStatus: 200,
    assert: ({ body, ctx }) => {
      expectSuccess(body);
      expectArray(body.data?.items, 'data.items');
      expectType(body.data?.total, 'number', 'data.total');
      ctx.existingJobId = body.data.items[0]?.id;
    },
  },
  {
    module: 'index-jobs',
    name: 'POST /index-jobs/rebuild-all creates rebuild job',
    method: 'POST',
    path: '/index-jobs/rebuild-all',
    auth: true,
    expectStatus: 202,
    assert: ({ body, ctx }) => {
      expectSuccess(body, '/api/index-jobs/rebuild-all');
      expectType(body.data?.job?.id, 'string', 'data.job.id');
      ctx.rebuildJobId = body.data.job.id;
    },
  },
  {
    module: 'index-jobs',
    name: 'GET /index-jobs/:id returns job detail',
    method: 'GET',
    path: ({ ctx }) => `/index-jobs/${ctx.rebuildJobId ?? ctx.existingJobId}`,
    auth: true,
    skip: ({ ctx }) => !(ctx.rebuildJobId ?? ctx.existingJobId),
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body);
      expectType(body.data?.id, 'string', 'data.id');
    },
  },
  {
    module: 'index-jobs',
    name: 'POST /index-jobs/:id/cancel covers cancel boundary',
    method: 'POST',
    path: ({ ctx }) => `/index-jobs/${ctx.rebuildJobId}/cancel`,
    auth: true,
    skip: ({ ctx }) => !ctx.rebuildJobId,
    expectStatus: [200, 201, 400],
    assert: ({ body, response }) => {
      if (response.status === 400) {
        expectTruthy(body.message, 'message');
        return;
      }
      expectSuccess(body);
    },
  },
  {
    module: 'index-jobs',
    name: 'POST /index-jobs/:id/retry rejects non-failed job',
    method: 'POST',
    path: ({ ctx }) => `/index-jobs/${ctx.rebuildJobId ?? ctx.existingJobId}/retry`,
    auth: true,
    skip: ({ ctx }) => !(ctx.rebuildJobId ?? ctx.existingJobId),
    expectStatus: [201, 409],
    assert: ({ body, response }) => {
      if (response.status === 409) {
        expectTruthy(body.message, 'message');
        return;
      }
      expectSuccess(body);
    },
  },
  {
    module: 'evaluation',
    name: 'POST /evaluation/cases creates evaluation case',
    method: 'POST',
    path: '/evaluation/cases',
    auth: true,
    body: {
      difficulty: 'smoke',
      expectedKeywords: ['市场'],
      query: '市场主体责任',
      tags: ['api-test'],
    },
    expectStatus: 201,
    assert: ({ body, ctx }) => {
      expectSuccess(body, '/api/evaluation/cases');
      expectType(body.data?.id, 'string', 'data.id');
      ctx.evaluationCaseId = body.data.id;
    },
  },
  {
    module: 'evaluation',
    name: 'GET /evaluation/cases lists cases',
    method: 'GET',
    path: '/evaluation/cases',
    auth: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/evaluation/cases');
      expectArray(body.data, 'data');
    },
  },
  {
    module: 'evaluation',
    name: 'POST /evaluation/runs runs evaluation',
    method: 'POST',
    path: '/evaluation/runs',
    auth: true,
    body: ({ ctx }) => ({
      caseId: ctx.evaluationCaseId,
      topK: 20,
    }),
    skip: ({ ctx }) => !ctx.evaluationCaseId,
    expectStatus: [200, 201],
    assert: ({ body }) => {
      expectSuccess(body, '/api/evaluation/runs');
      expectType(body.data?.id, 'string', 'data.id');
    },
  },
  {
    module: 'evaluation',
    name: 'GET /evaluation/runs lists runs',
    method: 'GET',
    path: '/evaluation/runs',
    auth: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/evaluation/runs');
      expectArray(body.data, 'data');
    },
  },
  {
    module: 'qa',
    name: 'POST /qa/ask returns fallback for no retrieval results',
    method: 'POST',
    path: '/qa/ask',
    auth: true,
    body: {
      question: `api-test-no-hit-${randomUUID()}`,
      topK: 5,
    },
    expectStatus: [200, 201],
    assert: ({ body }) => {
      expectSuccess(body, '/api/qa/ask');
      expectType(body.data?.answer, 'string', 'data.answer');
      expectArray(body.data?.citations, 'data.citations');
      expectEqual(body.data?.fallbackUsed, true, 'data.fallbackUsed');
      expectType(body.data?.retrievalTraceId, 'string', 'data.retrievalTraceId');
    },
  },
  {
    module: 'qa',
    name: 'POST /qa/ask returns legal QA structure',
    method: 'POST',
    path: '/qa/ask',
    auth: true,
    body: {
      question: '市场主体应当如何依法经营？',
      topK: 20,
    },
    expectStatus: [200, 201],
    assert: ({ body }) => {
      expectSuccess(body, '/api/qa/ask');
      expectType(body.data?.answer, 'string', 'data.answer');
      expectArray(body.data?.citations, 'data.citations');
      expectArray(body.data?.sourceChunks, 'data.sourceChunks');
      expectNoSecretLeak(body);
    },
  },
  {
    module: 'qa',
    name: 'POST /qa/ask supports knowledgeBaseIds',
    method: 'POST',
    path: '/qa/ask',
    auth: true,
    skip: ({ ctx }) => !ctx.knowledgeBaseId,
    body: ({ ctx }) => ({
      knowledgeBaseIds: [ctx.knowledgeBaseId],
      question: '市场主体应当如何依法经营？',
      topK: 20,
    }),
    expectStatus: [200, 201],
    assert: ({ body }) => {
      expectSuccess(body, '/api/qa/ask');
      expectType(body.data?.answer, 'string', 'data.answer');
      expectNoSecretLeak(body);
    },
  },
  {
    module: 'qa',
    name: 'POST /qa/ask live LLM smoke keeps citations contract',
    method: 'POST',
    path: '/qa/ask',
    auth: true,
    onlyWhen: () => runLlmTests,
    body: {
      question: '市场主体应当如何依法经营？',
      topK: 20,
    },
    expectStatus: [200, 201],
    assert: ({ body }) => {
      expectSuccess(body, '/api/qa/ask');
      expectType(body.data?.answer, 'string', 'data.answer');
      expectArray(body.data?.citations, 'data.citations');
      expectNoSecretLeak(body);
    },
  },
  {
    module: 'docs',
    name: 'GET Swagger JSON exposes current RAG docs',
    method: 'GET',
    url: docsJsonUrl,
    expectStatus: 200,
    assert: ({ body }) => {
      expectEqual(body.info?.title, 'rag-embedding', 'info.title');
      [
        '/api/auth/login',
        '/api/documents',
        '/api/search',
        '/api/qa/ask',
        '/api/evaluation/cases',
        '/api/index-jobs',
        '/api/knowledge-bases',
        '/api/system/user/list',
        '/api/system/role/list',
        '/api/system/menu/list',
        '/api/system/dept/list',
      ].forEach((path) => expectTruthy(body.paths?.[path], `paths.${path}`));
      expectTruthy(body.components?.schemas, 'components.schemas');
    },
  },
  {
    module: 'documents',
    name: 'DELETE /documents/:id deletes uploaded test document',
    method: 'DELETE',
    path: ({ ctx }) => `/documents/${ctx.documentId}`,
    auth: true,
    cleanup: true,
    skip: ({ ctx }) => !ctx.documentId,
    expectStatus: 202,
    assert: async ({ body, ctx }) => {
      expectSuccess(body);
      expectType(body.data?.job?.id, 'string', 'data.job.id');
      const job = await waitForIndexJob(ctx, body.data.job.id);
      expectEqual(job.status, 'succeeded', 'delete job status');
    },
  },
  {
    module: 'knowledge-base',
    name: 'DELETE /knowledge-bases/:id deletes test knowledge base',
    method: 'DELETE',
    path: ({ ctx }) => `/knowledge-bases/${ctx.knowledgeBaseId}`,
    auth: true,
    cleanup: true,
    skip: ({ ctx }) => !ctx.knowledgeBaseId,
    expectStatus: 200,
    assert: ({ body, ctx }) => {
      expectSuccess(body);
      expectEqual(body.data?.id, ctx.knowledgeBaseId, 'data.id');
    },
  },
  {
    module: 'auth',
    name: 'POST /auth/logout succeeds with token',
    method: 'POST',
    path: '/auth/logout',
    auth: true,
    cleanup: true,
    expectStatus: 200,
    assert: ({ body }) => {
      expectSuccess(body, '/api/auth/logout');
    },
  },
];

async function main() {
  await waitForBackend();

  const ctx = {};
  const selectedTests = selectTests(tests);
  const results = [];

  for (const test of selectedTests) {
    const startedAt = Date.now();

    try {
      if (test.auth && !ctx.accessToken) {
        await login(ctx);
      }

      if (shouldSkip(test, ctx)) {
        results.push({
          durationMs: Date.now() - startedAt,
          name: test.name,
          ok: true,
          skipped: true,
        });
        continue;
      }

      await runTest(test, ctx);
      results.push({ durationMs: Date.now() - startedAt, name: test.name, ok: true });
    } catch (error) {
      results.push({
        durationMs: Date.now() - startedAt,
        error,
        name: test.name,
        ok: false,
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

async function login(ctx) {
  const response = await fetch(apiUrl('/auth/login'), {
    body: JSON.stringify({ password, username }),
    headers: jsonHeaders(),
    method: 'POST',
  });
  const body = await readJson(response);

  expectEqual(response.status, 200, 'login HTTP status');
  expectSuccess(body, '/api/auth/login');
  expectType(body.data?.accessToken, 'string', 'login data.accessToken');
  ctx.accessToken = body.data.accessToken;
}

async function runTest(test, ctx) {
  const requestBody = resolveValue(test.body, ctx);
  const formBody = resolveValue(test.form, ctx);
  const target = resolveValue(test.url, ctx) ?? apiUrl(resolveValue(test.path, ctx));
  const response = await fetch(target, {
    body: formBody ?? (requestBody ? JSON.stringify(requestBody) : undefined),
    headers: formBody ? authHeaders(test, ctx) : {
      ...jsonHeaders(),
      ...authHeaders(test, ctx),
    },
    method: test.method,
  });
  const body = await readJson(response);

  expectStatus(response.status, test.expectStatus, 'HTTP status');
  await test.assert({ body, ctx, response });
}

async function waitForIndexJob(ctx, jobId) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(apiUrl(`/index-jobs/${jobId}`), {
      headers: authHeaders({ auth: true }, ctx),
    });
    const body = await readJson(response);
    expectStatus(response.status, 200, 'index job HTTP status');
    expectSuccess(body, `/api/index-jobs/${jobId}`);
    if (['canceled', 'failed', 'succeeded'].includes(body.data?.status)) {
      return body.data;
    }
    await delay(500);
  }
  throw new Error(`Index job ${jobId} did not reach a terminal state within ${timeoutMs}ms`);
}

function selectTests(allTests) {
  const byMode = allTests.filter((test) => {
    if (options.mode === 'docs') {
      return test.module === 'docs';
    }
    if (options.mode === 'api') {
      return test.module !== 'docs';
    }
    return true;
  });

  if (!options.module) {
    return byMode.filter((test) => test.onlyWhen?.() ?? true);
  }

  return byMode.filter((test) => {
    if (test.cleanup && options.module !== 'docs') {
      return true;
    }

    return test.module === options.module && (test.onlyWhen?.() ?? true);
  });
}

function shouldSkip(test, ctx) {
  return test.skip?.({ ctx }) ?? false;
}

function printResults(results) {
  console.log(`\nAPI test target: ${baseUrl}`);
  console.log(`Docs target: ${docsJsonUrl}`);
  if (options.module) {
    console.log(`Module filter: ${options.module}`);
  }

  for (const result of results) {
    const status = result.skipped ? 'SKIP' : result.ok ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.name} (${result.durationMs}ms)`);

    if (!result.ok) {
      console.log(`     ${formatError(result.error)}`);
    }
  }

  const passed = results.filter((result) => result.ok && !result.skipped).length;
  const skipped = results.filter((result) => result.skipped).length;
  console.log(`\n${passed}/${results.length} tests passed, ${skipped} skipped`);
}

async function readJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON response, got: ${text.slice(0, 200)}`);
  }
}

function resolveOptions(argv) {
  const moduleIndex = argv.indexOf('--module');
  return {
    help: argv.includes('--help') || argv.includes('-h'),
    mode: argv.includes('--docs-only')
      ? 'docs'
      : argv.includes('--api-only')
        ? 'api'
        : 'all',
    module: moduleIndex >= 0 ? argv[moduleIndex + 1] : undefined,
  };
}

function resolveValue(value, ctx) {
  if (typeof value === 'function') {
    return value({ ctx });
  }

  return value;
}

function apiUrl(path) {
  return `${baseUrl.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
}

function jsonHeaders() {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'x-request-id': `vite-test-${Date.now()}-${randomUUID()}`,
  };
}

function authHeaders(test, ctx) {
  return test.auth
    ? {
        authorization: `Bearer ${ctx.accessToken}`,
      }
    : {};
}

function expectSuccess(body, path) {
  expectEqual(body.code, 0, 'code');
  expectEqual(body.message, 'success', 'message');
  if (path) {
    expectEqual(body.path, path, 'path');
  }
  expectType(body.timestamp, 'string', 'timestamp');
  expectType(body.requestId, 'string', 'requestId');
}

function expectStatus(actual, expected, label) {
  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (!expectedList.includes(actual)) {
    throw new Error(`${label}: expected one of ${JSON.stringify(expectedList)}, got ${actual}`);
  }
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

function expectArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label}: expected array`);
  }
}

function expectTruthy(value, label) {
  if (!value) {
    throw new Error(`${label}: expected truthy value`);
  }
}

function expectAtMost(actual, max, label) {
  if (actual > max) {
    throw new Error(`${label}: expected at most ${max}, got ${actual}`);
  }
}

function expectCollectionPayload(value, label) {
  if (Array.isArray(value)) {
    return;
  }

  if (Array.isArray(value?.items) && typeof value.total === 'number') {
    return;
  }

  if (Array.isArray(value?.records) && typeof value.total === 'number') {
    return;
  }

  throw new Error(`${label}: expected array or paginated payload`);
}

function expectNoSecretLeak(value) {
  const text = JSON.stringify(value);
  if (/sk-[a-z0-9]{16,}/i.test(text) || /api[_-]?key/i.test(text)) {
    throw new Error('response appears to leak API key material');
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

await main();
