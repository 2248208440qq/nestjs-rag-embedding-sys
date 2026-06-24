# vite-test

Lightweight API and Swagger smoke tests for the local RAG backend.

The tests are intentionally small and deterministic. They validate public API
contracts, the unified response wrapper, auth error behavior, and Swagger docs.

## Run

Start the backend first:

```bash
pnpm dev:backend
```

Then run all smoke tests:

```bash
pnpm test:api
```

Run only API contract tests:

```bash
pnpm test:api -- --api-only
```

Run only Swagger document tests:

```bash
pnpm test:docs
```

For a one-command local check that starts Docker infrastructure and the backend
when needed:

```bash
pnpm test:api:local
```

`docker:test` is kept as an alias:

```bash
pnpm docker:test
```

## Environment

Defaults target the real local backend:

```bash
API_ORIGIN=http://localhost:3000
API_BASE_URL=http://localhost:3000/api
DOCS_JSON_URL=http://localhost:3000/docs-json
```

Override them when you want to test through the Vite dev proxy:

```bash
API_ORIGIN=http://localhost:5777 pnpm test:api
```

## Cases

- `GET /api/` verifies the unified success response wrapper.
- `GET /api/health` verifies health output is wrapped.
- `GET /docs-json` verifies Swagger exposes the current RAG/auth routes.
- `POST /api/auth/login` with Vben extra fields and invalid credentials verifies
  the backend returns a real `401`, not DTO whitelist errors.
- `POST /api/auth/logout` without a token verifies the backend returns one
  explicit `401` contract response.
- `GET /api/auth/codes` without a token verifies protected APIs reject missing
  credentials consistently.

## Writing Tests

Add cases to `scripts/vite-test/run.mjs` using this shape:

```js
{
  name: 'POST /example',
  method: 'POST',
  path: '/example',
  body: { value: 'demo' },
  expectStatus: 200,
  assert: (body) => {
    expectEqual(body.code, 0, 'code');
  },
}
```

Keep tests independent. They should validate public contracts, not internal
implementation details.
