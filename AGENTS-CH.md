# Agent 协作指南

本文说明编码 Agent 在本仓库中的协作方式。项目结构、运行方式或工作流变化时，需要同步更新 `readme.md`、`AGENTS.md`、`AGENTS-CH.md` 和相关 package 文档。

## 项目结构

- 根工作区：pnpm 8 + Turborepo，负责后端和共享包编排。
- `apps/frontend`：Vben Admin Vue 3 前端应用。它是一个嵌套 pnpm workspace，拥有独立 `package.json`、`pnpm-lock.yaml`、内部 packages 和 apps。根目录 `pnpm-workspace.yaml` 有意排除了它。
- `apps/backend`：NestJS API 服务，包含 Prisma、Redis、BullMQ、认证/RBAC、RAG、评估和法律问答。
- `packages/shared-types`：前后端共享的可序列化契约，必须保持框架无关。
- `packages/shared-backend`：仅后端使用的 DTO、装饰器、日志、请求上下文和工具。
- `packages/shared-ui`：仅 Vue 使用的 RAG 共享 UI 组件。
- `packages/*-config`：eslint、jest、TypeScript 配置包。
- `scripts/vite-test`：API smoke/contract 测试脚本。
- `design` 和 `.pencil`：设计工作区，不放运行时代码。
- `docker-compose.yml`：仅承载本地基础设施：PostgreSQL/pgvector、Redis、Qwen3-Embedding。

## 依赖边界

- apps 可以依赖 packages；packages 不允许依赖 apps。
- `@repo/shared-types` 不允许引入 NestJS、Vue、Prisma Client、Node 专属 API 或浏览器专属 API。
- `@repo/shared-backend` 只服务后端，前端不能导入。
- `@repo/shared-ui` 只服务 Vue UI，不能依赖具体应用的 router/store，也不能依赖后端运行时代码。
- 后端模块之间通过 Nest module imports/exports 和依赖注入通信，不创建跨模块的临时客户端。
- 跨包引用优先使用 `@repo/shared-types` 这类 package import，避免跨包相对路径。

## 前端约定

- RAG 管理端工作主要位于 `apps/frontend/apps/admin`。
- 使用 Vue 3 Composition API 和 `<script setup lang="ts">`。
- 优先遵循 Vben Admin 现有模式：`@vben/common-ui`、Vben adapters、路由、菜单权限和布局规范。
- 只有在 Vben 没有合适封装，或 RAG 低层组件需要时，才直接使用 Element Plus。
- 交互界面非必要优先使用 Vben 提供的组件而不是 Element Plus，并以 Tailwind CSS utility classes 作为主要样式层。
- RAG 页面位于 `apps/frontend/apps/admin/src/views/rag/*`。
- RAG API 客户端位于 `apps/frontend/apps/admin/src/api/rag/*`。
- API 契约、枚举和共享接口使用 `@repo/shared-types`。
- `@repo/shared-ui` 中不要写入具体应用的路由、store 或业务状态假设。
- 前端开发代理会把 `/api` 转发到 NestJS 后端。前端返回 `502` 通常表示后端 `3000` 未启动。

## 后端约定

- NestJS 模块按业务能力组织，统一放在 `apps/backend/src/modules/<feature>`。
- 当前主要模块包括：
  - `auth`、`users`、`roles`、`menus`、`depts`
  - `documents`、`files`、`extractors`、`chunking`、`embeddings`、`search`
  - `index-jobs`、`knowledge-base`、`evaluation`、`qa`、`agents`、`health`
- Controller 保持轻量，只做路由、DTO 和 HTTP 层处理；业务编排和持久化放在 Service。
- 使用构造器依赖注入。
- 运行时代码通过 `AppConfigService` 读取环境配置。除配置初始化/校验外，不直接读取 `process.env`。
- 数据库访问使用 `PrismaService`，Redis 访问使用 `RedisService`。不要在业务模块里临时创建 Prisma 或 Redis 客户端。
- 运行时日志使用 `@repo/shared-backend` 的 `CustomLogger`。避免在应用代码中直接使用 `console.*`。
- 请求 ID、统一响应、异常过滤和请求日志放在 `src/common`。
- 后端常量放在 `src/common/constants/<module>.constants.ts`，并通过 `src/common/constants/index.ts` 统一导出。
- 后端 `apps/backend/src` 内部导入统一使用 `@/` 路径别名，避免使用 `../` 和 `../../`。
- 后端全局前缀为 `/api`；Swagger 位于 `/docs`。
- 对外请求/响应契约应与 `@repo/shared-types` 对齐；不要直接把 Prisma 模型作为公开 API 契约。

## RAG 领域规则

- 文档流程：上传 -> 文本抽取 -> 法律切片 -> embedding -> chunk/vector 持久化 -> 检索。
- 索引必须以文档为粒度并可重试：写入新 chunk 前先删除目标文档旧 chunk。
- 删除文档时，应清理文档元数据、chunk/index 记录，并在存在本地上传文件时删除文件。
- 搜索结果应保留语义相关度和法律定位信息，例如 `sectionPath`、`articleNo`。
- LLM 未启用或不可用时，法律问答应返回可用的检索式 fallback。
- Provider key、JWT 密钥、数据库密码、上传文档和运行日志不得提交，也不得通过 Swagger、错误响应或测试快照暴露。

## 本地开发

根目录常用命令：

```bash
pnpm install
pnpm docker:up
pnpm --filter backend db:migrate
pnpm --filter backend prisma:seed
pnpm dev:backend
pnpm dev:frontend
```

常用检查：

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:api
pnpm test:api:local
```

前端专项命令优先通过根目录脚本执行，例如 `pnpm dev:frontend`；也可以进入 `apps/frontend` 使用 Vben workspace 自带脚本。

## 数据库操作

Prisma 命令应从 `apps/backend` 执行，或通过根目录 filtered scripts 执行。

```bash
pnpm --filter backend prisma:generate
pnpm --filter backend db:migrate
pnpm --filter backend prisma:migrate --name <name>
pnpm --filter backend prisma:seed
```

规则：

- 使用 `pnpm prisma:seed`，不要使用 `npx prisma db seed`。
- `schema.prisma` 与新 migration 目录需要一起提交。
- 不要修改已经在共享分支应用过的 migration 文件。
- 除非用户明确要求且已核对目标数据库，否则不要执行破坏性 reset。
- Windows 下如果 Prisma Client 生成失败并提示 query engine DLL 被占用，先停止后端 dev 服务再重试。

## 测试要求

- 修改结构、共享包或跨应用逻辑后，交付前运行 `pnpm build` 和 `pnpm lint`。
- 修改 Nest 模块、Prisma、Redis、DTO、Guard、Interceptor、Filter 或 API 契约时，运行后端测试/e2e。
- 修改 Vben 页面、API 客户端、路由、store 或共享 UI 时，运行前端类型、lint 和构建检查。
- API 行为变化时，同步更新 `scripts/vite-test` 用例。

## 仓库维护

- 不提交构建产物、日志、coverage、uploads 或本地运行数据。
- 不提交 `.env` 或真实密钥。`.env.example` 和 `.env.docker` 只能包含安全占位符或本地默认值。
- 新增依赖只加到实际使用它的 package。
- 不要为了减少 import 就跨边界搬移代码；保持所有权清晰。
- 新增命令、运行服务、模块或开发流程时，同步更新 `readme.md`、`AGENTS.md`、`AGENTS-CH.md` 或 package README。
