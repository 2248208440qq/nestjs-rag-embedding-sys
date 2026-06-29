# NestJS RAG Embedding Sys

面向法律知识库的 RAG 系统。项目采用 NestJS 后端、Vben Admin 前端、PostgreSQL + pgvector、Redis、Qwen3-Embedding 和可选 DeepSeek LLM，支持法律文档上传、文本抽取、法条切片、向量索引、混合检索、索引任务管理、检索评估和法律问答。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| Monorepo | pnpm workspace + Turborepo |
| Backend | NestJS 11, Prisma, PostgreSQL/pgvector, Redis, BullMQ, Swagger |
| Frontend | Vue 3, Vben Admin, Element Plus, Pinia, Vue Router |
| RAG | Qwen3-Embedding, pgvector similarity search, keyword search, RRF hybrid retrieval |
| QA | LangGraph-style fixed legal QA workflow, DeepSeek-compatible OpenAI API |
| Shared Packages | `@repo/shared-types`, `@repo/shared-backend`, `@repo/shared-ui` |

## Repository Layout

```text
.
├─ apps/
│  ├─ backend/      # NestJS API, Prisma, RAG pipeline, auth/RBAC, QA, jobs
│  ├─ frontend/     # Vben Admin frontend workspace
│  └─ infra/        # legacy/support infra files
├─ packages/
│  ├─ shared-types/     # serializable frontend/backend contracts
│  ├─ shared-backend/   # backend-only DTO/logger/request helpers
│  ├─ shared-ui/        # reusable Vue RAG components
│  └─ *-config/         # eslint/jest/typescript configs
├─ scripts/
│  └─ vite-test/    # API smoke/contract test runner
├─ design/          # design workspace
├─ docker-compose.yml
├─ AGENTS.md
└─ AGENTS-CH.md
```

> Note: the root pnpm workspace intentionally excludes `apps/frontend`; the frontend keeps its own Vben pnpm workspace. Use root scripts for project orchestration and `apps/frontend` scripts for Vben-specific work.

## Runtime Services

`docker-compose.yml` starts local infrastructure only:

- PostgreSQL + pgvector: `127.0.0.1:15432`
- Redis: `127.0.0.1:16379`
- Qwen3-Embedding OpenAI-compatible service: `http://localhost:8000/v1`

Backend and frontend run locally by default.

## Quick Start

Requirements:

- Node.js >= 18 for root/backend workspace
- pnpm 8.x for root workspace
- Docker Desktop with NVIDIA GPU support if running the embedding service locally
- For frontend-only Vben commands, follow `apps/frontend/package.json` engine requirements

```bash
# install root/backend packages
pnpm install

# start PostgreSQL, Redis and embedding service
pnpm docker:up

# apply database schema and seed RBAC/menu data
pnpm --filter backend db:migrate
pnpm --filter backend prisma:seed

# start backend on http://localhost:3000
pnpm dev:backend

# in another shell, start Vben admin frontend
pnpm dev:frontend
```

Useful URLs:

- Backend health: `http://localhost:3000/api/health`
- Swagger: `http://localhost:3000/docs`
- Frontend dev server: usually printed by Vben/Vite, commonly `http://localhost:5777`

Seed users:

```text
vben  / 123456      # super
admin / 123456789   # admin
jack  / 123456      # user
```

## Main Workflows

Document indexing:

```text
upload -> extract text -> legal chunking -> embedding -> pgvector persistence -> hybrid search
```

Legal QA:

```text
question -> normalize -> hybrid retrieval -> cited context -> LLM answer -> citation validation -> trace persistence
```

Key API areas:

- `/api/auth`, `/api/users`, `/api/roles`, `/api/menus`, `/api/depts`
- `/api/documents`, `/api/files`
- `/api/search`
- `/api/index-jobs`
- `/api/knowledge-bases`
- `/api/evaluation`
- `/api/qa`

## Common Commands

```bash
pnpm build             # build root workspace packages/apps
pnpm lint              # lint root workspace packages/apps
pnpm test              # run available tests
pnpm test:e2e          # backend e2e through turbo
pnpm test:api          # API smoke tests against a running backend
pnpm test:api:local    # start local infra/schema/seed and run API tests

pnpm docker:up
pnpm docker:down
pnpm docker:logs

pnpm dev:backend
pnpm dev:frontend
```

## Configuration

Backend environment files live in `apps/backend/`:

- `.env.example`: committed template
- `.env.docker`: local Docker-oriented defaults
- `.env`: local secrets and overrides, must not be committed

Important variables include:

- `DATABASE_URL`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `EMBEDDING_BASE_URL`, `EMBEDDING_MODEL`, `EMBEDDING_BATCH_SIZE`
- `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `LLM_ENABLED`, `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`

## Database Notes

Run Prisma commands from `apps/backend` or via root scripts:

```bash
pnpm --filter backend prisma:generate
pnpm --filter backend db:migrate
pnpm --filter backend prisma:seed
pnpm --filter backend prisma:studio
```

Do not use `npx prisma db seed`; this project uses `pnpm prisma:seed`.

## Development Rules

- Shared serializable contracts belong in `packages/shared-types`.
- Backend-only helpers belong in `packages/shared-backend`.
- Reusable Vue RAG UI belongs in `packages/shared-ui`.
- Do not commit `.env`, uploads, logs, coverage, build output, or real API keys.
- When API contracts change, update backend DTO/Swagger, shared types, frontend API calls, and API smoke tests together.

