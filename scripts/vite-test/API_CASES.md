# Backend API Test Cases

This file documents the smoke and contract cases implemented by
`scripts/vite-test/run.mjs`.

## Auth

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| Invalid credentials | POST | `/api/auth/login` | `401 UNAUTHORIZED`, no DTO whitelist error |
| Missing token codes | GET | `/api/auth/codes` | `401 No token provided` |
| Login | POST | `/api/auth/login` | Wrapped success with `accessToken` |
| Codes | GET | `/api/auth/codes` | Wrapped success with permission code array |
| Logout | POST | `/api/auth/logout` | Wrapped success with token |

## Health / App

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| App root | GET | `/api/` | Wrapped `Hello World!` |
| Health | GET | `/api/health` | Wrapped health payload |

## Documents

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| List | GET | `/api/documents` | Document array |
| Upload | POST | `/api/documents/upload` | Multipart text file upload creates document |
| Detail | GET | `/api/documents/:id` | Uploaded document detail |
| Extract | POST | `/api/documents/:id/extract` | `202` with a task, then poll to succeeded |
| Index | POST | `/api/documents/:id/index` | `202` with a task, then poll to succeeded |
| Delete | DELETE | `/api/documents/:id` | `202` with a task, then poll until removal succeeds |

## Search

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| TopK search | POST | `/api/search` | Results length is at most 20 |
| Knowledge base filter | POST | `/api/search` | Accepts `knowledgeBaseIds` |

## Index Jobs

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| List | GET | `/api/index-jobs` | Paginated job payload |
| Rebuild all | POST | `/api/index-jobs/rebuild-all` | `202` parent rebuild task is created |
| Detail | GET | `/api/index-jobs/:id` | Job detail |
| Cancel boundary | POST | `/api/index-jobs/:id/cancel` | Success or controlled `400` |
| Retry boundary | POST | `/api/index-jobs/:id/retry` | Success for failed job or controlled `400` |

## Evaluation

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| Create case | POST | `/api/evaluation/cases` | Evaluation case id |
| List cases | GET | `/api/evaluation/cases` | Case array |
| Run evaluation | POST | `/api/evaluation/runs` | Evaluation run id |
| List runs | GET | `/api/evaluation/runs` | Run array |

## Knowledge Base

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| Create | POST | `/api/knowledge-bases` | Knowledge base id |
| List | GET | `/api/knowledge-bases` | Knowledge base array |
| Detail | GET | `/api/knowledge-bases/:id` | Created knowledge base |
| Update | PATCH | `/api/knowledge-bases/:id` | Updated metadata |
| Bind documents | POST | `/api/knowledge-bases/:id/documents` | Bound knowledge base |
| Delete | DELETE | `/api/knowledge-bases/:id` | Created knowledge base is removed |

## QA

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| No retrieval fallback | POST | `/api/qa/ask` | `fallbackUsed: true`, trace persisted |
| Normal QA | POST | `/api/qa/ask` | Answer, citations, source chunks |
| Knowledge base QA | POST | `/api/qa/ask` | Accepts `knowledgeBaseIds` |
| Live LLM smoke | POST | `/api/qa/ask` | Only runs with `RUN_LLM_TESTS=true` |

## System / RBAC

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| Users | GET | `/api/system/user/list` | Paginated payload |
| Roles | GET | `/api/system/role/list` | Paginated payload |
| Menus | GET | `/api/system/menu/list` | Menu tree array |
| Departments | GET | `/api/system/dept/list` | Department tree array |

## Swagger

| Case | Method | Path | Expected |
| --- | --- | --- | --- |
| Docs JSON | GET | `/docs-json` | Contains auth, RAG, QA, evaluation, index job, knowledge base, and system paths |
