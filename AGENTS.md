# Agent Guide

## Directory Responsibilities

- `apps/frontend`: Vue 3 browser application (Vben Admin + Element Plus). Keep pages, routes, stores, API clients, and app-level composition here. The frontend is a separate pnpm workspace with its own package structure under `apps/frontend/packages` and `apps/frontend/apps/admin`.
- `apps/backend`: NestJS server application. Keep runtime backend wiring, `src/common` cross-cutting HTTP concerns, `src/config` typed environment access, `src/modules` business API modules, `src/prisma` database integration, `src/redis` cache integration, tests, and application bootstrap code here.
- `packages/shared-types`: Serializable TypeScript contracts shared by frontend and backend. Avoid framework imports here. Contains common response/error types, document, file, pagination, and search type definitions.
- `packages/shared-backend`: Backend-only shared code such as DTOs, mapped types, decorators, server helpers, custom logger, request context, and ID generation. Do not import this package from the frontend.
- `packages/shared-ui`: Vue 3 shared UI components for the RAG application (StatusTag, SourceTypeTag, FileUpload, DocumentTable, DocumentDetail, SearchBar, SearchResultList). Uses Element Plus and `@repo/shared-types`.
- `packages/eslint-config`, `packages/jest-config`, `packages/typescript-config`: Tooling configuration packages. Keep them generic and reusable.
- `design`: Design workspace. Store design files, exported design previews, and design notes here; do not place runtime application code or generated frontend assets in this folder.
- `apps/backend/docker`: Docker infrastructure support files, including PostgreSQL initialization SQL and Qwen3-Embedding model service. Keep application build artifacts out of this directory.

## Boundary Rules

- Codex should load relevant skills from `.agents/skills` before changing code in a specialized area. Examples: use `nestjs-best-practices` for NestJS work, `turborepo` for monorepo pipelines, `vue` for Vue SFCs, and `frontend-design` for UI implementation.
- Apps may depend on packages; packages should not depend on apps.
- Frontend and backend shared data shapes belong in `@repo/shared-types`.
- `@repo/shared-types` must remain framework-agnostic and serializable. Do not import NestJS, Vue, Prisma Client, browser APIs, or Node-only APIs there.
- Backend DTOs and Nest-specific helpers belong in `@repo/shared-backend`.
- `@repo/shared-backend` is backend-only. It may depend on NestJS-compatible primitives, but it must not depend on `apps/backend`.
- UI components should be exported from `@repo/shared-ui`.
- `@repo/shared-ui` is Vue-only. Do not add React dependencies, JSX-only APIs, or app-specific router/store coupling.
- Design source files and artifacts should stay under `design` so product/design work remains separate from app source code.
- Root `package.json` scripts should delegate package work to `turbo run`; root scripts may also own local infrastructure and smoke-test orchestration.
- Prefer package imports like `@repo/shared-types` over cross-package relative paths.
- Docker Compose is infrastructure-only. It runs PostgreSQL/pgvector, Redis, and the Qwen3-Embedding model service; backend and frontend code run locally unless a task explicitly asks for containerized application builds.

## Frontend Conventions

- Use Vue 3 Composition API with `<script setup lang="ts">`.
- Use Pinia setup stores for non-trivial state.
- Use Vue Router for screen-level navigation.
- Use fetch-based API client under `apps/frontend/apps/admin/src/api/rag/http.ts` for RAG backend requests.
- Prefer Vben Admin components and adapters from `@vben/common-ui`, `#/adapter/form`, and `#/adapter/vxe-table`; use Element Plus directly only when Vben does not provide an equivalent wrapper or low-level integration is required.
- Use the vue-vben-admin documentation on demand for component and layout patterns: https://deepwiki.com/vbenjs/vue-vben-admin
- Use `@repo/shared-ui` for reusable RAG-specific primitives.
- Keep API response/request contracts aligned with `@repo/shared-types`.
- The frontend RAG API client uses `code: 0` to determine success responses (aligned with backend `ResponseInterceptor`).

## Backend Conventions

- Keep NestJS modules feature-oriented.
- Put business API features under `apps/backend/src/modules/<feature>`. Current modules:
  - `documents`: Document upload, extraction, and management
  - `files`: File handling and storage
  - `search`: Vector similarity search
  - `embeddings`: Text embedding generation via Qwen3-Embedding service
  - `chunking`: Document text chunking/splitting
  - `extractors`: File content extraction (docx, pdf, etc.)
  - `health`: Health check endpoint
- Keep controllers thin. Controllers should validate and route requests; services own business logic and persistence orchestration.
- Prefer constructor injection.
- Validate API input at the boundary.
- Keep serializable return types aligned with `@repo/shared-types`.
- Use `AppConfigService` through the backend config module for environment access. Do not read `process.env` directly outside configuration bootstrap/validation code.
- Use `CustomLogger` from `@repo/shared-backend` for application logs. Avoid raw `console.*` in runtime code.
- Keep request/response shaping in `src/common`, including request ID handling, response interceptors, exception filters, and request logging middleware.
- Use Prisma through the backend Prisma module/service. Do not create ad hoc Prisma clients inside feature modules.
- Use Redis through the backend Redis module/service. Do not create ad hoc `ioredis` clients inside feature modules.
- Swagger should describe public API contracts and stay in sync with DTOs.
- The backend uses `api` as global prefix. All endpoints are accessible under `/api/*`.
- Environment files (`.env`, `.env.docker`, `.env.example`) live in `apps/backend/`, not the monorepo root.

## Testing And Automation

- Run `pnpm build` and `pnpm lint` before handing off structural or shared-package changes.
- Run backend unit/e2e tests when modifying NestJS modules, common middleware, filters, interceptors, Prisma, Redis, or API contracts.
- Use `pnpm docker:up` to start local Redis, PostgreSQL/pgvector, and Qwen3-Embedding service.
- Use `pnpm dev:backend` to start the local backend.
- Use `pnpm dev:backend:docker` to start infrastructure, apply Prisma schema, and run the backend.
- Keep scripts under `scripts` deterministic, documented, and safe to run repeatedly.

## Database Operations

All Prisma commands must be run from `apps/backend/`. Environment variables are loaded from `apps/backend/.env`.

### Migration

```bash
# Apply pending migrations (production-safe, no data loss)
cd apps/backend && node ../../scripts/with-env-docker.cjs prisma migrate deploy

# Create and apply a new migration after schema.prisma changes
cd apps/backend && npx prisma migrate dev --name <descriptive_name>

# Reset database (DESTRUCTIVE — drops all data and re-applies all migrations)
cd apps/backend && npx prisma migrate reset
```

### Seed

```bash
# IMPORTANT: use the npm script, NOT `npx prisma db seed`
# `npx prisma db seed` requires a `prisma.seed` field in package.json which is NOT configured.
# The project uses `scripts.prisma:seed` instead.
cd apps/backend && pnpm run prisma:seed
```

The seed script (`prisma/seed.ts`) creates:
- Roles: `super`, `admin`, `user`
- Menus: RAG knowledge base catalog + search/documents/index-jobs/evaluation/knowledge-base/qa menus, system management catalog + users/roles/menus/depts menus, plus button-level permissions
- Users: `vben`/`123456` (super), `admin`/`123456789` (admin), `jack`/`123456` (user)

### Generate Prisma Client

```bash
# After schema.prisma changes, regenerate the Prisma Client
cd apps/backend && node ../../scripts/with-env-docker.cjs prisma generate
# or: cd apps/backend && pnpm run prisma:generate
```

> Note: if the backend dev server is running, `prisma generate` may fail to rename the query engine DLL due to a file lock. Stop the dev server first, or run `npx prisma generate` after restarting.

### Common Pitfalls

- **Do not use `npx prisma db seed`** — it silently no-ops because `package.json` lacks the `prisma.seed` config field. Always use `pnpm run prisma:seed`.
- After adding a new Prisma model to `schema.prisma`, you must run `npx prisma migrate dev --name <name>` to create the table. The seed script does not create tables.
- If the frontend shows stale menu data after seeding, clear browser localStorage (the Vben admin persists access state) and re-login.

## Repository Hygiene

- Do not move logic across boundaries just to reduce imports. Keep ownership clear even if that means a little duplication at app edges.
- Do not commit generated build output, local logs, coverage output, or runtime data unless a package explicitly tracks it.
- Keep dependency additions scoped to the package that uses them.
- Update README or package docs when adding commands, directories, runtime services, or developer workflows.
