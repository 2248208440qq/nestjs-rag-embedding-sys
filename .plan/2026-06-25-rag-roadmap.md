# RAG Knowledge Base Roadmap

Created: 2026-06-25
Last updated: 2026-06-26 00:36:06

## Goal

Extend the current legal RAG knowledge base from a searchable document system into a maintainable, observable, and citation-backed legal knowledge platform.

Primary module targets:

- `evaluation`: Search evaluation
- `index-jobs`: Index task management
- `knowledge-base`: Knowledge base management
- `qa`: Legal question answering

## Current Implementation Status

Status after the first implementation pass:

- [x] Added shared contracts in `packages/shared-types`.
- [x] Added Prisma schema models and migration for the four RAG operation modules.
- [x] Added backend modules:
  - `apps/backend/src/modules/evaluation`
  - `apps/backend/src/modules/index-jobs`
  - `apps/backend/src/modules/knowledge-base`
  - `apps/backend/src/modules/qa`
- [x] Connected `DocumentsService.extract/index/remove` to index job records.
- [x] Added frontend API clients under `apps/frontend/apps/admin/src/api/rag`.
- [x] Added frontend route pages:
  - `/rag/index-jobs`
  - `/rag/evaluation`
  - `/rag/knowledge-base`
  - `/rag/qa`
- [x] Updated RAG frontend routes.
- [x] Added seed menu and permission entries for the new routes.
- [x] Changed admin `@repo/shared-types` dependency from `file:` to `link:` to avoid stale copied type definitions.
- [x] Verified:
  - `pnpm --filter @repo/shared-types build`
  - `pnpm --filter backend build`
  - `pnpm --filter backend prisma validate`
  - `pnpm --dir apps/frontend --filter @vben/admin typecheck`
  - `pnpm --dir apps/frontend --filter @vben/admin build`

Known blocker:

- [ ] `pnpm --filter backend db:generate` is blocked by a Windows Prisma engine DLL file lock:
  - `query_engine-windows.dll.node`
  - Stop active Node/backend/Prisma processes, then rerun generate.

## Phase 1: Index Jobs - Index Task Management

Purpose: make parsing, chunking, embedding, reindexing, and deletion reliable and observable.

### Completed

- [x] Added `index-jobs` module under `apps/backend/src/modules/index-jobs`.
- [x] Added index job shared contracts:
  - job type
  - status
  - progress
  - current step
  - error message
  - retry count
  - result snapshot
  - started/finished timestamps
- [x] Added Prisma model `IndexJob`.
- [x] Defined job types:
  - `parse_document`
  - `chunk_document`
  - `generate_embeddings`
  - `rebuild_document_index`
  - `rebuild_all_indexes`
  - `delete_document_index`
- [x] Defined job statuses:
  - `pending`
  - `running`
  - `succeeded`
  - `failed`
  - `canceled`
- [x] Refactored document extraction/index/delete flow to create job records.
- [x] Added APIs:
  - list jobs
  - get job detail
  - retry job
  - cancel job
  - create rebuild document index job
  - create rebuild all indexes job
- [x] Added frontend page `views/rag/index-jobs`.
- [x] Added job list table with status/type filters.
- [x] Added retry and cancel actions.
- [x] Added progress and error display.

### Remaining

- [ ] Implement real async worker/queue for index jobs.
- [ ] Make `rebuild_document_index` execute actual reindex flow instead of only creating a job.
- [ ] Make `rebuild_all_indexes` execute actual batch reindex flow instead of only creating a job.
- [ ] Add job detail drawer or modal.
- [ ] Add date range and document title filters.
- [ ] Add rebuild index action in document detail page.
- [ ] Add confirmation before rebuild-all.
- [ ] Add retry-safe and idempotent execution guards.
- [ ] Add unit/integration tests for failed indexing, retry, cancel, and cleanup behavior.

## Phase 2: Evaluation - Search Evaluation

Purpose: make retrieval quality measurable, explainable, and tunable.

### Completed

- [x] Added `evaluation` module under `apps/backend/src/modules/evaluation`.
- [x] Added evaluation case model:
  - query
  - expected document ids
  - expected chunk ids
  - expected legal article references
  - expected keywords
  - difficulty
  - tags
- [x] Added evaluation run model:
  - case id
  - query
  - topK
  - search params
  - result snapshot
  - metrics
- [x] Added APIs:
  - create evaluation case
  - list evaluation cases
  - list evaluation runs
  - run one evaluation case/query
- [x] Added basic metric calculation:
  - hit@K
  - recall@K
  - precision@K
  - MRR
  - matched document/chunk/article lists
- [x] Added frontend page `views/rag/evaluation`.
- [x] Added evaluation case list page.
- [x] Added evaluation case create modal.
- [x] Added run history table.
- [x] Added `topK` control for single-case runs.

### Remaining

- [ ] Add update/delete evaluation case APIs and UI.
- [ ] Add batch run support.
- [ ] Add compare evaluation runs view.
- [ ] Expose vector weight, keyword weight, RRF parameter, and rerank switch when backend supports runtime tuning.
- [ ] Show score breakdown in evaluation result table.
- [ ] Show expected vs actual hit comparison in detail view.
- [ ] Add unit tests for metric calculation.
- [ ] Add integration tests for evaluation run lifecycle.

## Phase 3: Knowledge Base - Knowledge Base Management

Purpose: organize legal documents by domain, source, status, tags, and validity.

### Completed

- [x] Added `knowledge-base` module under `apps/backend/src/modules/knowledge-base`.
- [x] Added `KnowledgeBase` and `KnowledgeBaseDocument` Prisma models.
- [x] Added knowledge base fields:
  - name
  - code
  - description
  - category
  - status
- [x] Added APIs:
  - create knowledge base
  - update knowledge base
  - delete knowledge base
  - list knowledge bases
  - get knowledge base detail
  - bind documents to knowledge base
- [x] Added metadata filter support to search by `knowledgeBaseIds`.
- [x] Added frontend page `views/rag/knowledge-base`.
- [x] Added knowledge base list page.
- [x] Added create/edit modal.
- [x] Added delete action.
- [x] Added RBAC permission codes and seed menu entries.

### Remaining

- [ ] Add knowledge base detail page.
- [ ] Add document binding/unbinding UI.
- [ ] Add document legal metadata form:
  - legal domain
  - issuing authority
  - source level
  - effective date
  - expiry date
  - validity status
- [ ] Add tag management model, APIs, and UI.
- [ ] Add duplicate document detection:
  - file hash
  - normalized title
  - optional source URL
- [ ] Add search filters by knowledge base, legal domain, validity status, and tags on the frontend.
- [ ] Decide whether a document can belong to multiple knowledge bases or should have one primary knowledge base.

## Phase 4: QA - Legal Question Answering

Purpose: provide citation-backed legal answers on top of the retrieval system.

### Completed

- [x] Added `qa` module under `apps/backend/src/modules/qa`.
- [x] Added QA shared contracts:
  - question
  - knowledge base filter
  - topK
  - answer
  - citations
  - source chunks
  - retrieval trace id
- [x] Added retrieval-based QA endpoint:
  - `POST /api/qa/ask`
- [x] Reused hybrid search as the retrieval layer.
- [x] Added citation mapping from search results.
- [x] Added `QaTrace` persistence.
- [x] Added frontend page `views/rag/qa`.
- [x] Added legal question input.
- [x] Added answer panel.
- [x] Added citation list.
- [x] Added loading state.

### Remaining

- [ ] Replace extractive draft answer with real LLM generation.
- [ ] Add query normalization/rewrite before retrieval.
- [ ] Add optional rerank.
- [ ] Add context compression.
- [ ] Add prompt assembly templates.
- [ ] Add citation validation:
  - every key claim maps to source chunks
  - expose law title and article number when available
- [ ] Add streaming response support.
- [ ] Add cancel and retry states.
- [ ] Add source chunk preview.
- [ ] Add knowledge base filter in UI.
- [ ] Add copy/export answer actions.
- [ ] Add answer feedback:
  - useful
  - not useful
  - wrong citation
  - missing law
- [ ] Add tests for prompt assembly and citation mapping.

## Cross-Cutting Status

### Completed

- [x] Added shared contracts to `packages/shared-types`.
- [x] Kept backend DTOs inside feature modules where Nest-specific validation is needed.
- [x] Added RBAC permission code constants for:
  - `rag:evaluation:*`
  - `rag:index-job:*`
  - `rag:knowledge-base:*`
  - `rag:qa:*`
- [x] Added menus and seed data for new routes.
- [x] Added frontend route definitions under admin app routes.
- [x] Added API clients under admin app API layer.
- [x] Added Prisma schema and migration.

### Remaining

- [ ] Run `pnpm --filter backend db:generate` after releasing Prisma DLL lock.
- [ ] Run database migration:
  - `pnpm --filter backend db:migrate`
- [ ] Run seed:
  - `pnpm --filter backend prisma:seed`
- [ ] Add request/response tests under `scripts/vite-test` or dedicated API test scripts.
- [ ] Add backend unit/e2e tests for new modules.
- [ ] Add README/developer workflow updates for the new RAG operation modules.
- [ ] Add permissions to frontend buttons using `/auth/codes` consistently.

## Recommended Next Implementation Order

1. Finish `index-jobs` execution semantics.
   - Add worker/queue or controlled synchronous executor.
   - Make rebuild document/all jobs actually run.
   - Add idempotency and retry behavior.

2. Tighten `evaluation`.
   - Add case update/delete.
   - Add run detail and comparison.
   - Add score breakdown display.

3. Deepen `knowledge-base`.
   - Add document binding UI.
   - Add legal metadata and filters.
   - Add duplicate detection.

4. Upgrade `qa`.
   - Add LLM generation.
   - Add citation validation.
   - Add streaming and feedback.

## Key Risks

- `rebuild-all` currently only creates a task record; users may expect it to execute immediately.
- Prisma generate is blocked until the Windows DLL file lock is released.
- QA is currently retrieval-based extractive draft generation, not final LLM QA.
- Evaluation currently measures basic hit metrics but does not yet support ranking parameter comparison.
- Knowledge base metadata must be reflected in both search filters and document management UI; otherwise it becomes decorative data.

## Definition Of Done For This Roadmap

- Search quality can be evaluated with repeatable benchmark cases.
- Indexing is observable, retryable, and safe.
- Legal documents can be organized and filtered by knowledge base metadata.
- Legal answers include source citations and retrieval traceability.
- New modules follow the existing NestJS, Vben Admin, and shared contract boundaries.
