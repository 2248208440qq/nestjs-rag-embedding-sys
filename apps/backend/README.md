# RAG Knowledge Base Backend

NestJS backend for the legal RAG knowledge base. It owns authentication/RBAC, document ingestion, text extraction, legal chunking, vector indexing, hybrid retrieval, index job orchestration, knowledge-base management, retrieval evaluation, and legal QA.

All public API routes are prefixed with `/api`. Swagger is available at `/docs` and `/docs-json` after the backend starts.

## Directory Structure

```text
apps/backend/
├─ src/
│  ├─ common/          # decorators, filters, guards, constants, interceptors, middleware, utilities
│  ├─ config/          # env validation and AppConfigService
│  ├─ prisma/          # PrismaService
│  ├─ redis/           # RedisService
│  ├─ modules/
│  │  ├─ agents/       # DeepSeek-compatible LLM service and legal QA graph
│  │  ├─ auth/         # JWT login/logout/refresh and permission code support
│  │  ├─ users/roles/menus/depts/ # RBAC system management
│  │  ├─ documents/    # document upload, extract, index, delete and metadata
│  │  ├─ files/        # local upload storage and file helpers
│  │  ├─ extractors/   # PDF/DOCX/text extraction
│  │  ├─ chunking/     # legal article/section-aware chunking
│  │  ├─ embeddings/   # Qwen3-Embedding API client
│  │  ├─ search/       # vector, keyword and hybrid retrieval
│  │  ├─ index-jobs/   # BullMQ-backed parse/index/rebuild/delete job records
│  │  ├─ knowledge-base/ # knowledge-base CRUD and document binding
│  │  ├─ evaluation/   # retrieval evaluation cases/runs
│  │  ├─ qa/           # legal QA endpoint orchestration
│  │  └─ health/       # health check
│  ├─ app.module.ts
│  ├─ app.setup.ts
│  └─ main.ts
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ docker/
│  ├─ embedding/
│  └─ postgres/
├─ uploads/            # local runtime upload files; do not commit
├─ .env.example
├─ .env.docker
└─ package.json
```

## Runtime Dependencies

| Service | Default endpoint | Purpose |
| --- | --- | --- |
| Backend | `http://localhost:3000` | NestJS API server |
| PostgreSQL + pgvector | `127.0.0.1:15432` | business data, vectors, jobs and traces |
| Redis | `127.0.0.1:16379` | cache, queues and job processing |
| Qwen3-Embedding | `http://localhost:8000/v1` | embedding generation |
| DeepSeek-compatible LLM | `https://api.deepseek.com` | optional legal QA generation |

## Local Development

From the repository root:

```bash
pnpm docker:up
pnpm --filter backend db:migrate
pnpm --filter backend prisma:seed
pnpm dev:backend
```

Equivalent commands from `apps/backend`:

```bash
pnpm db:migrate
pnpm prisma:seed
pnpm dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Seed users:

```text
vben  / 123456      # super
admin / 123456789   # admin
jack  / 123456      # user
```

## Environment

Environment files are fixed under `apps/backend/`.

- `.env.example`: committed template
- `.env.docker`: local Docker defaults; no real secrets
- `.env`: local private config; must not be committed

Important variables:

- `DATABASE_URL`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `EMBEDDING_BASE_URL`, `EMBEDDING_MODEL`, `EMBEDDING_BATCH_SIZE`
- `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE`
- `LLM_ENABLED`, `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_TEMPERATURE`, `LLM_MAX_TOKENS`, `LLM_TIMEOUT_MS`

Use `AppConfigService` in runtime code. Do not read `process.env` directly outside config bootstrap/validation.

## RAG Flow

```text
upload
  -> extract text
  -> legal chunking
  -> embedding generation
  -> chunk/vector persistence
  -> vector + keyword retrieval
  -> optional QA context and answer generation
```

Document extraction, indexing and deletion may be represented as index jobs. Indexing deletes old chunks for the target document before writing new chunks and vectors. Deleting a document should remove the DB record, cascade/delete chunk records, and remove local upload files when present.

## API Areas

```text
POST /api/auth/login
GET  /api/health

POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/:id
POST   /api/documents/:id/extract
POST   /api/documents/:id/index
DELETE /api/documents/:id

POST /api/search
GET  /api/index-jobs
POST /api/qa/ask

GET/POST/PATCH/DELETE /api/knowledge-bases
GET/POST/PATCH/DELETE /api/evaluation/*
```

Use Swagger for exact request and response contracts.

## Prisma

Run Prisma commands from `apps/backend` or through root filter scripts.

```bash
pnpm prisma:generate
pnpm db:migrate
pnpm prisma:migrate --name <migration_name>
pnpm prisma:seed
pnpm prisma:studio
```

Rules:

- Do not use `npx prisma db seed`; use `pnpm prisma:seed`.
- Commit `schema.prisma` and new migration directories together.
- Do not edit already-applied migration files in shared branches.
- Avoid `prisma migrate reset` in shared environments because it drops data.
- If `prisma generate` fails on Windows due to a locked query engine DLL, stop the backend Node process and retry.

## Testing

```bash
pnpm --filter backend build
pnpm --filter backend lint
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter backend prisma validate
```

Repository-level API smoke tests:

```bash
pnpm test:api
pnpm test:docs
pnpm test:api:local
```

See `scripts/vite-test/README.md` and `scripts/vite-test/API_CASES.md`.

## Implementation Rules

- Keep controllers thin; services own business orchestration.
- Validate input DTOs at API boundaries.
- Use `PrismaService`, `RedisService`, `AppConfigService` and injected feature services; do not create ad hoc clients inside modules.
- Keep HTTP-facing serializable contracts aligned with `@repo/shared-types`.
- Put Nest-only DTOs/decorators/logger/request helpers in `@repo/shared-backend`.
- Keep request ID, response shape, exception filters and request logging in `src/common`.
- Put backend constants in `src/common/constants/<module>.constants.ts` and export them from `src/common/constants/index.ts`.
- Use the `@/` alias for imports under `apps/backend/src`; avoid `../` and `../../` in backend source files.
- Do not expose Prisma models directly as public API contracts.
- Do not commit uploads, logs, coverage, `.env`, provider keys, JWT secrets, database passwords, or test snapshots containing sensitive data.

## Troubleshooting

- `5777/api/*` returns 502: the frontend dev proxy is running but backend `3000` is probably down. Check `http://localhost:3000/api/health`.
- `401 No token provided`: protected route needs `Authorization: Bearer <accessToken>`.
- Document/index job stuck in `failed`: inspect `/api/index-jobs` `errorMessage`, then check extractor, embedding service, Redis and PostgreSQL/pgvector health.
- QA returns fallback: retrieval or LLM generation failed/unavailable; inspect trace/job logs and LLM environment variables.
- Port conflict on `3000`: use `Get-NetTCPConnection -LocalPort 3000 -State Listen` before stopping any process.
