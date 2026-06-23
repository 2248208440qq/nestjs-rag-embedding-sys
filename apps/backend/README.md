# RAG Embedding Backend

NestJS backend for the legal knowledge-base service.

## Current modules

- `health`: service health endpoint.
- `files`: normalized file upload endpoint.
- `documents`: upload, extract, chunk, embed, and index knowledge documents.
- `search`: vector search over indexed chunks.
- `prisma`: shared Prisma client for PostgreSQL + pgvector.
- `common`: request id, API response wrapper, and error response wrapper.

## Local database

```bash
docker compose up -d postgres
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
```

The backend loads root `.env.docker` by default for local Docker-based runs.
Default database URL:

```text
postgresql://rag:rag_password@127.0.0.1:15432/rag_embedding?schema=public
```

## Document indexing flow

```text
POST /api/documents/upload
  -> POST /api/documents/:id/extract
  -> POST /api/documents/:id/index
  -> POST /api/search
```

Upload example:

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@./example.txt" \
  -F "sourceType=law" \
  -F "tags=contract"
```

Extract text:

```bash
curl -X POST http://localhost:3000/api/documents/{id}/extract
```

Chunk and embed:

```bash
curl -X POST http://localhost:3000/api/documents/{id}/index
```

Search:

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"contract termination liability","topK":8}'
```
