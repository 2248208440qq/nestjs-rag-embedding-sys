# vite-test

Lightweight backend API smoke tests for the local NestJS service.

Docker is used only for required infrastructure: Redis and PostgreSQL with pgvector.

## Run

Start infrastructure and the local backend first:

```bash
pnpm dev:backend
```

Then run:

```bash
pnpm test:api
```

For a one-command local smoke check, use:

```bash
pnpm docker:test
```

This command starts Docker infrastructure, applies the Prisma schema, starts the
local backend if needed, runs the API cases, and stops only the backend process
it started.

The default target is `http://localhost:3000`. Override it with:

```bash
API_BASE_URL=http://localhost:3000 pnpm test:api
```

## Cases

- `GET /` verifies the unified success response wrapper.
- `GET /docs-json` verifies Swagger is exposed.
- `GET /users` verifies the user API returns a wrapped list.
- `GET /users/not-found` verifies the unified error response wrapper.

## Writing Tests

Add cases to `scripts/vite-test/run.mjs` using this shape:

```js
{
  name: 'GET /example',
  method: 'GET',
  path: '/example',
  expectStatus: 200,
  assert: (body) => {
    expectEqual(body.code, 0, 'code')
  },
}
```

Keep tests independent and deterministic. Tests should validate API contracts, not implementation details.
