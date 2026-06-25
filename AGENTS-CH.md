# Agent 指南

## 目录职责

- `apps/frontend`：Vue 3 浏览器前端应用（Vben Admin + Element Plus）。页面、路由、状态管理、API 客户端和应用级组合逻辑放在这里。前端是独立的 pnpm workspace，拥有自己的包结构（`apps/frontend/packages` 和 `apps/frontend/apps/web-ele`）。
- `apps/backend`：NestJS 后端服务应用。后端运行时装配、`src/common` HTTP 横切能力、`src/config` 类型化环境配置、`src/modules` 业务 API 模块、`src/prisma` 数据库集成、`src/redis` 缓存集成、测试和应用启动代码放在这里。
- `packages/shared-types`：前后端共享的可序列化 TypeScript 契约。这里不能引入框架依赖。包含通用响应/错误类型、文档、文件、分页和搜索类型定义。
- `packages/shared-backend`：仅后端使用的共享代码，例如 DTO、mapped types、装饰器、服务端 helper、自定义日志、请求上下文和 ID 生成。前端不能导入此包。
- `packages/shared-ui`：Vue 3 RAG 应用共享 UI 组件库（StatusTag、SourceTypeTag、FileUpload、DocumentTable、DocumentDetail、SearchBar、SearchResultList）。使用 Element Plus 和 `@repo/shared-types`。
- `packages/eslint-config`、`packages/jest-config`、`packages/typescript-config`：工具链配置包。保持通用、可复用。
- `design`：设计工作区。存放设计文件、导出的设计预览和设计说明；不要放运行时代码或前端生成产物。
- `apps/backend/docker`：Docker 基础设施辅助文件，包括 PostgreSQL 初始化 SQL 和 Qwen3-Embedding 模型服务。不要放应用构建产物。

## 职责边界

- Codex 在修改专项代码前，应按需加载 `.agents/skills` 中的相关技能。例如：NestJS 使用 `nestjs-best-practices`，monorepo/Turbo 使用 `turborepo`，Vue SFC 使用 `vue`，UI 实现使用 `frontend-design`。
- 应用可以依赖 packages；packages 不应依赖 apps。
- 前后端共享的数据结构放在 `@repo/shared-types`。
- `@repo/shared-types` 必须保持框架无关且可序列化。不要导入 NestJS、Vue、Prisma Client、浏览器 API 或 Node 专属 API。
- 后端 DTO、Nest 专属 helper 和服务端工具放在 `@repo/shared-backend`。
- `@repo/shared-backend` 只服务后端，可以包含 Nest 兼容能力，但不能依赖 `apps/backend`。
- UI 组件从 `@repo/shared-ui` 导出。
- `@repo/shared-ui` 只面向 Vue。不要加入 React 依赖、JSX-only API 或绑定具体应用的 router/store。
- 设计源文件和资产统一放在 `design`，让产品设计工作与应用源码分离。
- 根目录 `package.json` 负责把 package 任务委托给 `turbo run`；同时可以承载本地基础设施和 smoke test 编排脚本。
- 跨包引用优先使用 `@repo/shared-types` 这类 package import，不使用跨包相对路径。
- Docker Compose 只负责基础设施。默认运行 PostgreSQL/pgvector、Redis 和 Qwen3-Embedding 模型服务；后端和前端代码在本地运行，除非任务明确要求应用容器化构建。

## 前端约定

- 使用 Vue 3 Composition API 和 `<script setup lang="ts">`。
- 非平凡状态使用 Pinia setup store。
- 页面级导航使用 Vue Router。
- RAG 后端请求使用 `apps/frontend/apps/web-ele/src/api/rag/http.ts` 中的 fetch 客户端。
- 复杂应用控件使用 Element Plus，RAG 专属可复用组件放在 `@repo/shared-ui`。
- 请求和响应契约必须与 `@repo/shared-types` 保持一致。
- 前端 RAG API 客户端通过 `code: 0` 判断成功响应（与后端 `ResponseInterceptor` 对齐）。

## 后端约定

- NestJS 模块按业务功能组织。
- 业务 API 功能放在 `apps/backend/src/modules/<feature>`。当前模块：
  - `documents`：文档上传、提取和管理
  - `files`：文件处理和存储
  - `search`：向量相似度搜索
  - `embeddings`：通过 Qwen3-Embedding 服务生成文本嵌入
  - `chunking`：文档文本分块/拆分
  - `extractors`：文件内容提取（docx、pdf 等）
  - `health`：健康检查端点
- Controller 保持轻量，只负责校验和路由请求；Service 负责业务逻辑和持久化编排。
- 优先使用构造函数注入。
- 在 API 边界校验输入。
- 可序列化返回类型必须与 `@repo/shared-types` 对齐。
- 环境变量通过后端 config module 和 `AppConfigService` 访问。除配置启动和校验代码外，不要直接读取 `process.env`。
- 运行时代码使用 `@repo/shared-backend` 的 `CustomLogger` 记录日志。避免直接使用 `console.*`。
- 请求和响应规范放在 `src/common`，包括 request id、响应拦截器、异常过滤器和请求日志中间件。
- Prisma 只能通过后端 Prisma module/service 使用。不要在业务模块里临时创建 Prisma Client。
- Redis 只能通过后端 Redis module/service 使用。不要在业务模块里临时创建 `ioredis` 客户端。
- Swagger 文档需要描述公开 API 契约，并与 DTO 保持同步。
- 后端使用 `api` 作为全局前缀，所有端点在 `/api/*` 下访问。
- 环境文件（`.env`、`.env.docker`、`.env.example`）放在 `apps/backend/` 下，不在 monorepo 根目录。

## 测试与自动化

- 修改项目结构或共享包后，交付前运行 `pnpm build` 和 `pnpm lint`。
- 修改 NestJS 模块、common 中间件、过滤器、拦截器、Prisma、Redis 或 API 契约时，需要运行后端单元测试或 e2e 测试。
- 使用 `pnpm docker:up` 启动本地 Redis、PostgreSQL/pgvector 和 Qwen3-Embedding 服务。
- 使用 `pnpm dev:backend` 本地运行后端。
- 使用 `pnpm dev:backend:docker` 启动基础设施、同步 Prisma schema 并运行后端。
- `scripts` 下的脚本要可重复运行、可维护，并配套必要文档。

## 数据库操作

所有 Prisma 命令必须在 `apps/backend/` 目录下执行。环境变量从 `apps/backend/.env` 加载。

### 数据库迁移

```bash
# 应用待执行的迁移（生产安全，不丢数据）
cd apps/backend && node ../../scripts/with-env-docker.cjs prisma migrate deploy

# 修改 schema.prisma 后创建并应用新迁移
cd apps/backend && npx prisma migrate dev --name <描述性名称>

# 重置数据库（危险操作——删除所有数据并重新应用所有迁移）
cd apps/backend && npx prisma migrate reset
```

### 种子数据

```bash
# 重要：使用 npm script，不要用 `npx prisma db seed`
# `npx prisma db seed` 需要 package.json 中的 `prisma.seed` 配置项，项目未配置。
# 项目使用的是 `scripts.prisma:seed`。
cd apps/backend && pnpm run prisma:seed
```

种子脚本（`prisma/seed.ts`）创建以下数据：
- 角色：`super`、`admin`、`user`
- 菜单：法律 RAG 知识库目录 + 检索/文档/索引任务/检索评估/知识库管理/法律问答菜单，系统管理目录 + 用户/角色/菜单/部门管理菜单，以及按钮级权限
- 用户：`vben`/`123456`（super）、`admin`/`123456789`（admin）、`jack`/`123456`（user）

### 生成 Prisma Client

```bash
# 修改 schema.prisma 后重新生成 Prisma Client
cd apps/backend && node ../../scripts/with-env-docker.cjs prisma generate
# 或：cd apps/backend && pnpm run prisma:generate
```

> 注意：如果后端 dev 服务正在运行，`prisma generate` 可能因文件锁定无法重命名查询引擎 DLL。需先停止 dev 服务，或重启后执行 `npx prisma generate`。

### 常见陷阱

- **不要使用 `npx prisma db seed`** — 它会静默跳过，因为 `package.json` 没有 `prisma.seed` 配置项。必须使用 `pnpm run prisma:seed`。
- 在 `schema.prisma` 中新增 Prisma 模型后，必须执行 `npx prisma migrate dev --name <名称>` 来创建数据库表。种子脚本不会创建表。
- 执行 seed 后如果前端菜单数据仍是旧数据，清除浏览器 localStorage（Vben admin 会持久化 access 状态）后重新登录。

## 仓库维护要求

- 不要为了减少 import 就随意跨边界搬逻辑。即使应用边缘有少量重复，也要保持职责归属清晰。
- 不要提交构建产物、本地日志、coverage 输出或运行时数据，除非某个包明确需要跟踪。
- 新增依赖时，只加到实际使用它的 package。
- 新增命令、目录、运行服务或开发流程时，同步更新 README 或对应 package 文档。
