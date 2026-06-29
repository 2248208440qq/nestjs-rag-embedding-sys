# NestJS RAG Embedding Sys

面向法律专业知识库的 RAG 系统。项目使用 NestJS 作为后端服务，Vue 3 / Vben Admin 作为管理端，PostgreSQL + pgvector 保存向量索引，Redis 承担缓存和异步任务协作，Qwen3-Embedding 提供文本向量化能力。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vben Admin、Element Plus、Pinia、Vue Router、Vite |
| 后端 | NestJS 11、Prisma、Swagger、BullMQ、Redis、LangChain / LangGraph |
| 数据库 | PostgreSQL 16、pgvector |
| 向量模型 | Qwen3-Embedding，本地 Docker 服务 |
| 共享包 | `@repo/shared-types`、`@repo/shared-backend`、`@repo/shared-ui` |
| 工程化 | pnpm workspace、Turborepo、Docker Compose、ESLint、Jest |

## 目录结构

```text
apps/
  backend/            NestJS 后端服务
  frontend/           Vben Admin 前端工作区
packages/
  shared-types/       前后端共享的序列化类型
  shared-backend/     后端专用共享能力
  shared-ui/          RAG 前端共享 Vue 组件
  eslint-config/      ESLint 配置
  jest-config/        Jest 配置
  typescript-config/  TypeScript 配置
design/               设计源文件与设计产物
scripts/              本地开发、环境加载、测试辅助脚本
```

## 本地服务

Docker Compose 只承载基础设施，前后端默认在本机直接运行。

| 服务 | 默认端口 | 说明 |
| --- | --- | --- |
| PostgreSQL / pgvector | `15432` | 数据库名 `rag_embedding` |
| Redis | `16379` | 缓存和任务队列 |
| Qwen3-Embedding | `8000` | 文本向量化服务 |
| Backend | `3000` | NestJS API，统一前缀 `/api` |
| Frontend | 以前端 Vite 输出为准 | Vben Admin 管理端 |

## 快速启动

```bash
# 安装依赖
pnpm install

# 启动 PostgreSQL、Redis、Embedding 服务
pnpm docker:up

# 生成 Prisma Client 并同步数据库
pnpm backend:db:push

# 初始化角色、菜单、用户等基础数据
pnpm backend:db:seed

# 启动后端
pnpm dev:backend

# 启动前端
pnpm dev:frontend
```

默认种子账号：

| 用户名 | 密码 | 角色 |
| --- | --- | --- |
| `vben` | `123456` | 超级管理员 |
| `admin` | `123456789` | 管理员 |
| `jack` | `123456` | 普通用户 |

## 核心流程

文档入库流程：

```text
上传文件 -> 保存原始文件 -> 创建文档记录 -> 抽取文本 -> 切片 -> 调用 Embedding 服务 -> 写入 pgvector -> 更新索引状态
```

检索与问答流程：

```text
用户输入问题 -> 生成查询向量 -> pgvector 相似度检索 -> 返回命中文档、章节、条文和相关度 -> 可进入 QA 生成回答
```

## API 模块

后端 API 统一使用 `/api` 前缀，主要模块包括：

| 模块 | 说明 |
| --- | --- |
| `documents` | 文档上传、详情、解析、索引、删除 |
| `files` | 本地文件存储和访问 |
| `extractors` | DOCX、PDF 等文件文本抽取 |
| `chunking` | 文本切片 |
| `embeddings` | 向量生成 |
| `search` | 语义检索 |
| `index-jobs` | 索引任务管理 |
| `knowledge-base` | 知识库管理 |
| `qa` | 问答能力 |
| `evaluation` | 检索与问答评估 |
| `auth` / `users` / `roles` / `menus` / `depts` | 管理端权限与系统基础能力 |

## 常用命令

```bash
# 启动基础设施
pnpm docker:up

# 停止基础设施
pnpm docker:down

# 查看基础设施日志
pnpm docker:logs

# 启动后端
pnpm dev:backend

# 启动前端
pnpm dev:frontend

# 构建全部工作区
pnpm build

# 代码检查
pnpm lint

# 测试
pnpm test
```

## 数据库操作

Prisma 命令应在 `apps/backend/` 下执行，环境变量从 `apps/backend/.env` 或 `.env.docker` 加载。

```bash
# 生成 Prisma Client
cd apps/backend && pnpm run prisma:generate

# 开发环境同步 schema
cd apps/backend && pnpm run prisma:push

# 创建并应用迁移
cd apps/backend && npx prisma migrate dev --name <migration_name>

# 初始化种子数据
cd apps/backend && pnpm run prisma:seed
```

注意：项目使用 `pnpm run prisma:seed`，不要直接使用 `npx prisma db seed`。

## 环境配置

后端环境文件位于 `apps/backend/`：

| 文件 | 说明 |
| --- | --- |
| `.env` | 本地默认运行环境 |
| `.env.docker` | 连接 Docker 基础设施的默认环境 |
| `.env.example` | 环境变量示例 |

后端运行时代码应通过 `AppConfigService` 读取环境变量，不要在业务模块中直接读取 `process.env`。

## 开发约定

- 前后端共享请求、响应、分页、文档、检索等类型放在 `packages/shared-types`。
- `packages/shared-types` 必须保持框架无关，不引入 NestJS、Vue、Prisma、Node 或浏览器专属 API。
- 后端 NestJS DTO、装饰器、日志、请求上下文等能力放在 `packages/shared-backend`。
- RAG 相关 Vue 组件优先沉淀到 `packages/shared-ui`。
- 后端业务代码按功能模块放在 `apps/backend/src/modules`。
- 后端常量放在 `apps/backend/src/common/constants`，并通过 `src/common/constants/index.ts` 统一导出。
- 后端 `apps/backend/src` 内部导入统一使用 `@/` 路径别名。
- 前端 RAG 页面放在 `apps/frontend/apps/admin/src/views/rag`，API 客户端放在 `apps/frontend/apps/admin/src/api/rag`。
- 新增运行命令、目录、基础设施或开发流程时，同步更新 README 和 Agent 文档。
