# RAG Knowledge Base Backend

这是法律专业知识库 RAG 系统的 NestJS 后端。它负责文档上传、文本抽取、切片、向量化、索引入库、语义检索、问答、评估，以及 Vben Admin 所需的用户、角色、菜单和权限接口。

## 后端职责

- 提供统一 `/api/*` HTTP API。
- 使用 Prisma 访问 PostgreSQL / pgvector。
- 使用 Redis / BullMQ 执行异步索引任务。
- 调用 Qwen3-Embedding 服务生成文本向量。
- 保存上传文件，并维护文档、切片、索引任务等业务数据。
- 统一请求 ID、响应格式、异常格式、日志和 Swagger 文档。

## 目录结构

```text
apps/backend/
  docker/             PostgreSQL 初始化 SQL、Embedding 服务镜像文件
  prisma/             Prisma schema、迁移、种子脚本
  src/
    common/           拦截器、过滤器、守卫、常量、中间件、工具函数
    config/           环境变量校验与类型化配置
    modules/          业务模块
    prisma/           PrismaModule / PrismaService
    redis/            RedisModule / RedisService
    main.ts           应用启动入口
  test/               e2e 测试
```

主要业务模块：

| 模块 | 说明 |
| --- | --- |
| `documents` | 文档上传、详情、解析、索引、删除 |
| `files` | 文件存储与文件访问 |
| `extractors` | DOCX、PDF 等文本抽取 |
| `chunking` | 文本切片 |
| `embeddings` | Embedding 服务封装 |
| `search` | 向量语义检索 |
| `index-jobs` | 索引任务管理 |
| `knowledge-base` | 知识库管理 |
| `qa` | 检索增强问答 |
| `evaluation` | 检索和问答评估 |
| `auth`、`users`、`roles`、`menus`、`depts` | 管理端基础权限能力 |

## 运行依赖

| 服务 | 默认地址 | 说明 |
| --- | --- | --- |
| PostgreSQL / pgvector | `localhost:15432` | 存储业务数据和向量索引 |
| Redis | `localhost:16379` | 缓存和任务队列 |
| Qwen3-Embedding | `http://localhost:8000` | 文本向量化 |

在仓库根目录执行：

```bash
pnpm docker:up
```

## 本地开发

```bash
# 在仓库根目录安装依赖
pnpm install

# 启动基础设施
pnpm docker:up

# 生成 Prisma Client
cd apps/backend && pnpm run prisma:generate

# 同步数据库 schema
cd apps/backend && pnpm run prisma:push

# 初始化基础数据
cd apps/backend && pnpm run prisma:seed

# 启动后端开发服务
pnpm dev:backend
```

也可以在根目录使用组合命令：

```bash
pnpm dev:backend:docker
```

## 环境变量

环境文件放在 `apps/backend/`：

| 文件 | 说明 |
| --- | --- |
| `.env` | 本地默认环境 |
| `.env.docker` | 连接 Docker 基础设施的环境 |
| `.env.example` | 示例配置 |

配置读取规则：

- 使用 `@nestjs/config` 进行环境变量加载和校验。
- 业务代码通过 `AppConfigService` 获取配置。
- 除配置启动和校验代码外，不在业务模块直接读取 `process.env`。

## 文档索引流程

```text
1. 客户端上传文件
2. FilesService 保存原始文件
3. DocumentsService 创建文档记录
4. Extractors 模块抽取正文
5. Chunking 模块按章节、条文或长度切片
6. Embeddings 模块请求 Qwen3-Embedding
7. Prisma 写入文档、切片、向量和任务状态
8. 搜索模块基于 pgvector 返回相似结果
```

删除文档时，应同时清理：

- 文档记录
- 文档切片
- 向量索引
- 索引任务记录
- 后端本地上传文件

## API 规范

- 全局前缀：`/api`
- 成功响应由 `ResponseInterceptor` 统一包装。
- 异常响应由全局异常过滤器统一处理。
- 每个请求带有 request id，便于日志追踪。
- Swagger 文档应与 DTO 保持同步。
- 请求和响应类型应尽量与 `@repo/shared-types` 对齐。

## Prisma

常用命令：

```bash
# 生成 Prisma Client
cd apps/backend && pnpm run prisma:generate

# 开发环境同步 schema
cd apps/backend && pnpm run prisma:push

# 创建并应用迁移
cd apps/backend && npx prisma migrate dev --name <migration_name>

# 应用已有迁移
cd apps/backend && node ../../scripts/with-env-docker.cjs prisma migrate deploy

# 初始化种子数据
cd apps/backend && pnpm run prisma:seed
```

注意事项：

- 新增或修改 Prisma model 后需要重新生成 Prisma Client。
- 如果开发服务正在运行，Windows 上 `prisma generate` 可能因为 query engine DLL 被占用而失败，需要先停止后端服务。
- 项目未配置 `prisma.seed` 字段，种子数据请使用 `pnpm run prisma:seed`。

## 测试与检查

```bash
# 单元测试
cd apps/backend && pnpm test

# e2e 测试
cd apps/backend && pnpm test:e2e

# 代码检查
cd apps/backend && pnpm lint

# 构建
cd apps/backend && pnpm build
```

结构性修改、共享类型修改、Prisma 修改或 API 合同修改后，建议至少运行：

```bash
pnpm build
pnpm lint
```

## 开发约定

- 控制器保持轻量，只负责校验、路由和响应。
- 服务层负责业务流程和持久化编排。
- 使用构造函数注入依赖。
- 使用 `CustomLogger` 记录运行日志，避免在运行时代码中直接使用 `console.*`。
- 后端常量放在 `src/common/constants/<module>.constants.ts`，并通过 `src/common/constants/index.ts` 统一导出。
- `apps/backend/src` 内部导入统一使用 `@/` 路径别名，避免使用 `../` 和 `../../`。
- 通过 PrismaModule 使用 Prisma，不在业务模块中创建临时 Prisma Client。
- 通过 RedisModule 使用 Redis，不在业务模块中创建临时 Redis 客户端。
- 后端专用 DTO、装饰器和工具优先放入 `@repo/shared-backend`。
- 可序列化的前后端共享类型放入 `@repo/shared-types`。
