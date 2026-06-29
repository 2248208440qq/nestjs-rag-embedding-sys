# vite-test

Lightweight API smoke and contract tests for the local RAG backend.

The runner covers public app health, auth, RAG documents/search/index jobs,
evaluation, knowledge base, QA, RBAC system endpoints, and Swagger docs. It is
designed to be deterministic and safe to run repeatedly against a local
development database.

## Run

Start the backend first:

```bash
pnpm dev:backend
```

Then run all smoke tests:

```bash
pnpm test:api
```

Run only Swagger document tests:

```bash
pnpm test:docs
```

Run one module:

```bash
pnpm test:api -- --module qa
pnpm test:api -- --module knowledge-base
pnpm test:api -- --module system
```

For a one-command local check that starts Docker infrastructure, syncs schema,
seeds users/roles/menus, and starts the backend when needed:

```bash
pnpm test:api:local
```

`docker:test` is kept as an alias:

```bash
pnpm docker:test
```

## Modules

Available module filters:

```text
auth
app
documents
search
index-jobs
evaluation
knowledge-base
qa
system
docs
```

Cleanup tests always run with a module filter so test documents and knowledge
bases created during the run are removed.

## Environment

Defaults target the local backend directly:

```bash
API_ORIGIN=http://localhost:3000
API_BASE_URL=http://localhost:3000/api
DOCS_JSON_URL=http://localhost:3000/docs-json
API_TEST_USERNAME=admin
API_TEST_PASSWORD=123456789
```

Override them when testing through the Vite dev proxy:

```bash
API_ORIGIN=http://localhost:5777 pnpm test:api
```

DeepSeek tests do not require real API calls by default. To include the live LLM
structure check:

```bash
RUN_LLM_TESTS=true pnpm test:api -- --module qa
```

The live test only validates response structure, citations contract, and that no
secret-like key material is present in the public response.

## Auth

Document extraction, indexing, and deletion are asynchronous. The runner polls
their returned task IDs to verify that each operation reaches a terminal state.

Authenticated tests log in once and keep the access token in memory. The default
credentials are created by `apps/backend/prisma/seed.ts`:

```text
admin / 123456789
```

Use `pnpm test:api:local` if a fresh database has not been seeded yet.

## Adding Cases

Add cases to `scripts/vite-test/run.mjs`:

```js
{
  module: 'qa',
  name: 'POST /qa/ask returns legal QA structure',
  method: 'POST',
  path: '/qa/ask',
  auth: true,
  body: { question: '市场主体应当如何依法经营？', topK: 20 },
  expectStatus: [200, 201],
  assert: ({ body }) => {
    expectSuccess(body, '/api/qa/ask');
    expectType(body.data?.answer, 'string', 'data.answer');
  },
}
```

Cases can read and write shared run context through `ctx`, for example
`knowledgeBaseId`, `documentId`, `evaluationCaseId`, and `jobId`.
