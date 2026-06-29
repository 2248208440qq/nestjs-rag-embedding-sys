# RAG Knowledge Base Backend

法律 RAG 知识库的 NestJS 后端。它负责身份与权限、法规文件处理、向量与关键词混合检索、索引任务、知识库管理、检索评估，以及基于 DeepSeek 的固定法律问答流程。

所有公开接口均以 `/api` 为前缀。Swagger 文档在后端启动后可通过 `/docs` 和 `/docs-json` 访问。

## Directory Structure

```text
apps/backend/
├─ src/
│  ├─ common/          # HTTP 响应、异常过滤、认证与授权 Guard、请求日志
│  ├─ config/          # 环境变量校验与 AppConfigService
│  ├─ prisma/          # PrismaService 与数据库访问入口
│  ├─ redis/           # RedisService 与缓存连接入口
│  ├─ modules/         # 按业务能力划分的 NestJS 特性模块
│  │  ├─ agents/       # DeepSeek LLM 与 LangGraph 固定 RAG 问答图
│  │  ├─ auth/         # JWT 登录、登出、权限码
│  │  ├─ documents/    # 文档上传、解析、索引、删除
│  │  ├─ search/       # 向量、关键词与 RRF 混合检索
│  │  ├─ knowledge-base/ # 知识库及文档绑定
│  │  ├─ index-jobs/   # 解析、索引与重建任务记录
│  │  ├─ evaluation/   # 检索评估用例与运行记录
│  │  ├─ qa/           # 法律问答 API 编排入口
│  │  ├─ users|roles|menus|depts/ # RBAC 系统管理
│  │  ├─ chunking/     # 法律条文感知分块
│  │  ├─ embeddings/   # Embedding 服务客户端
│  │  ├─ extractors/   # PDF、DOCX、文本等内容提取
│  │  ├─ files/        # 上传存储与文件名处理
│  │  └─ health/       # 健康检查
│  ├─ app.module.ts    # 模块装配与全局 Guard
│  ├─ app.setup.ts     # 全局 prefix、Pipe、Filter、Interceptor、CORS
│  └─ main.ts          # NestJS 启动与 Swagger 初始化
├─ prisma/
│  ├─ schema.prisma    # PostgreSQL / pgvector 数据模型
│  ├─ migrations/      # 不可变的数据库迁移历史
│  └─ seed.ts          # 初始用户、角色、菜单和权限码
├─ docker/             # PostgreSQL、Redis、Embedding 基础设施支持文件
├─ uploads/            # 本地上传文件，仅开发运行时数据
├─ .env.example        # 可提交的环境变量模板
├─ .env                # 本地密钥与配置，不提交
└─ package.json
```

## Responsibilities And Boundaries

### Backend owns

- API 输入校验、鉴权、RBAC 授权、统一响应和异常转换。
- 文档的上传、文件解析、法律分块、向量生成、索引持久化和索引任务状态。
- PostgreSQL/pgvector、Redis、Embedding 服务与 DeepSeek API 的后端连接。
- 检索、评估、知识库绑定和法律问答 trace 的持久化。

### Backend does not own

- 页面路由、交互状态、表格和表单逻辑，归 `apps/frontend/apps/admin` 所有。
- 可序列化前后端合同，归 `@repo/shared-types` 所有；不得在该包引入 NestJS、Prisma 或 Node API。
- 通用后端 DTO、装饰器与日志能力，归 `@repo/shared-backend` 所有；前端不得依赖该包。
- 可复用 Vue RAG 组件归 `@repo/shared-ui` 所有；后端不应引用它。
- Docker Compose 仅运行 PostgreSQL、Redis 和 Embedding 服务，不承载前端或后端应用进程。

### Module rules

- 控制器只做路由、DTO 和 HTTP 层工作；业务编排放在 Service。
- 使用构造器注入 `PrismaService`、`RedisService`、`AppConfigService` 等依赖，不在模块中创建客户端。
- 环境变量只允许在 `config` 校验层和 `AppConfigService` 中读取，业务代码禁止直接读取 `process.env`。
- 公共请求与响应类型使用 `@repo/shared-types`；Nest DTO 和数据库模型不可直接泄露到 HTTP 响应。
- 新功能应放入 `src/modules/<feature>`，通过模块 `imports/exports` 建立依赖，避免跨模块相对路径耦合和循环依赖。

## Capabilities

| Area | Main capabilities |
| --- | --- |
| Authentication and RBAC | JWT access/refresh token、用户/角色/菜单/部门管理、路由菜单和操作权限码。 |
| Documents | 上传不超过 50 MB 的文件、提取文本、法律条文分块、向量化、重建和删除索引。 |
| Retrieval | pgvector 相似度检索、关键词检索和 RRF 融合；支持 `topK` 与知识库过滤。 |
| Knowledge bases | 知识库 CRUD、文档绑定与筛选检索。 |
| Index jobs | 解析、索引、全量重建、失败信息、重试与取消边界管理。 |
| Evaluation | 评估用例、预期文档/分块/条文、检索运行快照与指标。 |
| Legal QA | LangGraph 固定流程：问题规范化、检索、上下文构建、DeepSeek 生成、引文校验、trace 持久化；LLM 或检索不可用时返回可用的检索式 fallback。 |

## Runtime Dependencies

| Service | Default local endpoint | Purpose |
| --- | --- | --- |
| Backend | `http://localhost:3000` | NestJS API server。 |
| Frontend dev proxy | `http://localhost:5777` | Vben 前端开发服务器，会将 `/api` 代理至后端；不是后端监听端口。 |
| PostgreSQL + pgvector | `127.0.0.1:15432` | 业务数据、向量和任务记录。 |
| Redis | `127.0.0.1:16379` | 缓存与运行时支持。 |
| Embedding service | `http://localhost:8000/v1` | Qwen3 Embedding 向量生成。 |
| DeepSeek API | `https://api.deepseek.com` | `deepseek-v4-flash` 法律问答生成。 |

环境文件固定放在 `apps/backend/`：

- `.env.example`：可提交的变量说明和空占位符。
- `.env.docker`：本地 Docker 基础设施配套配置，不得写入真实密钥。
- `.env`：本地开发配置，必须忽略提交。`LLM_API_KEY` 只应保留在该文件或部署平台密钥管理中。

关键环境变量包括 `DATABASE_URL`、`REDIS_*`、`EMBEDDING_*`、`JWT_*`、`LLM_ENABLED`、`LLM_PROVIDER`、`LLM_BASE_URL`、`LLM_MODEL`、`LLM_API_KEY`、`LLM_TEMPERATURE`、`LLM_MAX_TOKENS` 和 `LLM_TIMEOUT_MS`。

## Local Development

从仓库根目录执行：

```bash
# 启动 PostgreSQL、Redis 与 Embedding 服务
pnpm docker:up

# 根据已有迁移同步数据库，并写入开发用户、菜单和权限
pnpm --filter backend db:migrate
pnpm --filter backend prisma:seed

# 启动后端，默认监听 3000
pnpm dev:backend
```

也可在 `apps/backend/` 内执行等效命令：

```bash
pnpm db:generate
pnpm db:migrate
pnpm prisma:seed
pnpm dev
```

健康检查：

```bash
curl http://localhost:3000/api/health
```

开发数据库的默认种子账号：

```text
vben / 123456       # super
admin / 123456789   # admin
jack / 123456       # user
```

## Document And QA Flow

```text
upload -> extract -> legal chunking -> embeddings -> chunk persistence -> hybrid search
                                                                     -> index job status

question -> normalize -> hybrid search -> build cited context -> DeepSeek -> citation validation -> QA trace
```

常用接口：

```text
POST /api/documents/upload
POST /api/documents/:id/extract  # returns 202 + task
POST /api/documents/:id/index    # returns 202 + task
DELETE /api/documents/:id        # returns 202 + task
POST /api/search
POST /api/qa/ask
GET  /api/index-jobs
```

文档解析、索引和删除由 BullMQ/Redis 后台任务执行，接口立即返回任务记录。索引会先删除该文档旧的 chunks，再写入新分块与向量，因此重新索引不需要清空其他已上传数据。索引写入采用数据库生成 UUID；迁移必须保留 `knowledge_document_chunks.id` 的 `gen_random_uuid()` 默认值，原始 SQL 写入也应显式提供 `id`。

## Database Maintenance

所有 Prisma 命令都应从 `apps/backend/` 执行，或通过对应的根目录脚本执行。

```bash
# schema.prisma 修改后生成 Prisma Client
pnpm prisma:generate

# 创建开发迁移；提交 schema 与新 migrations 目录
pnpm prisma:migrate --name <descriptive_name>

# 部署已有迁移，不会删除数据
pnpm db:migrate

# 写入或更新种子数据
pnpm prisma:seed
```

不要使用 `npx prisma db seed`，本项目通过 `pnpm prisma:seed` 执行种子脚本。不要在共享环境使用 `prisma migrate reset`，它会删除数据。若 `prisma generate` 因 Windows DLL 被占用而失败，先停止后端 Node 进程再重试。

## Testing And Verification

```bash
# 后端构建与单元测试
pnpm --filter backend build
pnpm --filter backend test

# Prisma schema 校验
pnpm --filter backend prisma validate

# API smoke/contract tests（要求后端已启动）
pnpm test:api
pnpm test:api -- --module qa
pnpm test:docs

# 自动启动基础设施、同步 schema、seed 并执行 API 测试
pnpm test:api:local
```

完整 API 用例和筛选参数见 [`scripts/vite-test/README.md`](../../scripts/vite-test/README.md) 与 [`scripts/vite-test/API_CASES.md`](../../scripts/vite-test/API_CASES.md)。默认 QA 测试验证 fallback；仅在明确需要调用真实 DeepSeek 时使用 `RUN_LLM_TESTS=true`。

## Operational Notes

- `3000` 被占用时，先确认监听者：`Get-NetTCPConnection -LocalPort 3000 -State Listen`。不要随意结束非本项目进程。
- `5777/api/*` 返回 `502` 通常表示 Vite 代理存在但 `3000` 后端未启动；先访问 `http://localhost:3000/api/health`。
- `401 No token provided` 表示受保护接口未携带 `Authorization: Bearer <accessToken>`，与文档索引或向量数据库无关。
- 文档状态卡在 `failed` 时，查看 `/api/index-jobs` 的 `errorMessage`，再检查文件解析、Embedding 服务和 PostgreSQL/pgvector 健康状态。
- DeepSeek 请求失败不会暴露 provider 原始异常或密钥，法律问答会标记 `fallbackUsed: true` 并返回检索式答案。
- `LLM_API_KEY`、JWT 密钥、数据库密码、上传文件和运行日志均不得提交仓库或写入 Swagger、测试快照和错误响应。
- 修改 API 合同时，同时更新 DTO、Swagger、`@repo/shared-types`、前端 API 调用和 `scripts/vite-test` 用例。

## Change Checklist

提交后端变更前至少确认：

1. 新模块没有破坏依赖边界，且 Controller 保持轻量。
2. 新输入经过 DTO 校验，新的公开接口已更新 Swagger。
3. `schema.prisma` 变更有对应迁移；迁移不修改已提交的历史目录。
4. 敏感配置没有进入 `.env.example`、日志、测试输出或 Git。
5. 执行受影响的 build、unit test、Prisma 校验与 API smoke 测试。
