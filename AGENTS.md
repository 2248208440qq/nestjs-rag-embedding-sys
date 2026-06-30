# Agent Guide

This file describes how coding agents should work in this repository. Keep it aligned with `readme.md`, `AGENTS-CH.md`, and package-level docs when structure or workflows change.

## Project Shape

- Root workspace: pnpm 8 + Turborepo orchestration for backend and shared packages.
- `apps/frontend`: Vben Admin Vue 3 application. It is a nested pnpm workspace with its own `package.json`, `pnpm-lock.yaml`, packages and apps. The root `pnpm-workspace.yaml` intentionally excludes it.
- `apps/backend`: NestJS API server with Prisma, Redis, BullMQ, auth/RBAC, RAG modules, evaluation and QA.
- `packages/shared-types`: framework-agnostic serializable contracts shared by backend and frontend.
- `packages/shared-backend`: backend-only DTOs, decorators, logger, request context and helpers.
- `packages/shared-ui`: Vue-only reusable RAG UI components.
- `packages/*-config`: eslint, jest and TypeScript configuration packages.
- `scripts/vite-test`: API smoke/contract test runner.
- `design` and `.pencil`: design workspace files, not runtime application code.
- `docker-compose.yml`: local infrastructure only: PostgreSQL/pgvector, Redis and Qwen3-Embedding.

## Dependency Boundaries

- Apps may import packages; packages must not import apps.
- `@repo/shared-types` must not import NestJS, Vue, Prisma Client, Node-only APIs or browser-only APIs.
- `@repo/shared-backend` is backend-only and must never be imported by frontend code.
- `@repo/shared-ui` is Vue-only and must not depend on app router/store state or backend runtime code.
- Backend modules should communicate through Nest module imports/exports and injected services, not cross-module ad hoc clients.
- Prefer package imports such as `@repo/shared-types` over cross-package relative paths.

## Frontend Conventions

- Work under `apps/frontend/apps/admin` for the RAG admin app.
- Use Vue 3 Composition API with `<script setup lang="ts">`.
- Use Vben Admin patterns first: `@vben/common-ui`, Vben adapters, project routes, access/menu system and existing layout conventions.
- Use Element Plus directly only when Vben does not provide the right primitive or for low-level RAG-specific UI.
- For agent interaction screens, prefer Vben-provided components before Element Plus, and use Tailwind CSS utility classes as the primary styling layer.
- RAG pages currently live under `apps/frontend/apps/admin/src/views/rag/*`.
- RAG API clients live under `apps/frontend/apps/admin/src/api/rag/*`.
- Use `@repo/shared-types` for API contracts and shared enums/interfaces.
- Do not make app-specific router/store assumptions inside `@repo/shared-ui`.
- The frontend backend proxy points `/api` to the NestJS backend. A `502` from the frontend dev server usually means backend `3000` is not running.

## Backend Conventions

- Keep NestJS modules feature-oriented under `apps/backend/src/modules/<feature>`.
- Current feature modules include:
  - `auth`, `users`, `roles`, `menus`, `depts`
  - `documents`, `files`, `extractors`, `chunking`, `embeddings`, `search`
  - `index-jobs`, `knowledge-base`, `evaluation`, `qa`, `agents`, `health`
- Keep controllers thin. Controllers route requests and apply DTO validation; services own orchestration and persistence.
- Use constructor injection.
- Use `AppConfigService` for environment access. Avoid direct `process.env` reads outside config bootstrap/validation.
- Use `PrismaService` for database access and `RedisService` for Redis access. Do not create ad hoc Prisma or Redis clients in feature modules.
- Use `CustomLogger` from `@repo/shared-backend` for runtime logging. Avoid raw `console.*` in application code.
- Keep request IDs, response wrapping, exception filters and request logging in `src/common`.
- Keep backend constants in `src/common/constants/<module>.constants.ts` and export them through `src/common/constants/index.ts`.
- Use the backend `@/` path alias for imports under `apps/backend/src`; avoid `../` and `../../` imports in backend source files.
- Backend uses the global prefix `/api`; Swagger is served at `/docs`.
- Public response/request contracts should align with `@repo/shared-types`; do not expose Prisma models directly as API contracts.

## RAG Domain Rules

- Document flow: upload -> extract -> legal chunking -> embedding -> chunk/vector persistence -> search.
- Indexing must be document-scoped and safe to retry: delete old chunks for the target document before writing new chunks.
- Deleting a document must clean document metadata, chunk/index records and local upload files when present.
- Search should preserve both semantic relevance and legal location metadata such as `sectionPath` and `articleNo`.
- QA should return usable fallback output when LLM generation is disabled or unavailable.
- Provider keys, JWT secrets, database passwords, uploaded documents and runtime logs must not be committed or exposed through Swagger/errors/tests.

## Local Development

Root-level commands:

```bash
pnpm install
pnpm docker:up
pnpm --filter backend db:migrate
pnpm --filter backend prisma:seed
pnpm dev:backend
pnpm dev:frontend
```

Common checks:

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:api
pnpm test:api:local
```

Frontend-specific commands should usually be run through the root script (`pnpm dev:frontend`) or from `apps/frontend` with the Vben workspace scripts.

## Database Operations

Run Prisma commands from `apps/backend` or via root filtered scripts.

```bash
pnpm --filter backend prisma:generate
pnpm --filter backend db:migrate
pnpm --filter backend prisma:migrate --name <name>
pnpm --filter backend prisma:seed
```

Rules:

- Use `pnpm prisma:seed`; do not use `npx prisma db seed`.
- Commit schema and migration changes together.
- Do not edit already-applied migrations on shared branches.
- Do not run destructive resets unless the user explicitly asks and the target database is verified.
- If Prisma Client generation fails on Windows due to a locked DLL, stop the backend dev server and retry.

## Testing Expectations

- Run `pnpm build` and `pnpm lint` before handing off structural, shared-package or cross-app changes.
- Run backend tests/e2e when touching Nest modules, Prisma, Redis, DTOs, guards, interceptors, filters or API contracts.
- Run frontend type/lint/build checks when touching Vben pages, API clients, routes, stores or shared UI.
- Update `scripts/vite-test` cases when API behavior changes.

## Repository Hygiene

- Do not commit generated build output, logs, coverage, uploads or local runtime data.
- Do not commit `.env` or real secrets. `.env.example` and `.env.docker` may contain safe placeholders/defaults only.
- Keep dependency additions scoped to the package that uses them.
- Do not move code across ownership boundaries just to reduce imports.
- Update `readme.md`, `AGENTS.md`, `AGENTS-CH.md` or package READMEs when adding commands, runtime services, modules or workflows.
