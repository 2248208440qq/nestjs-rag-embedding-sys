# RAG Knowledge Base Frontend

这是法律专业知识库 RAG 系统的前端管理端，基于 Vue 3、Vben Admin、Element Plus、Pinia、Vue Router 和 Vite 构建。它提供文档管理、文件上传、文档预览、语义检索、索引任务、知识库管理、评估和问答等页面。

## 工作区说明

`apps/frontend` 是一个独立的 Vben Admin 前端工作区，内部也包含自己的 pnpm workspace。仓库根目录的 `pnpm-workspace.yaml` 排除了 `apps/frontend`，因此根目录通过专门脚本委托启动前端。

根目录启动方式：

```bash
pnpm dev:frontend
```

前端目录内启动方式：

```bash
cd apps/frontend
pnpm install
pnpm dev:admin
```

## 目录结构

```text
apps/frontend/
  apps/
    admin/
      src/
        api/rag/       RAG 后端 API 客户端
        views/rag/     RAG 业务页面
        router/        路由配置
        store/         前端状态管理
  packages/            Vben 前端内部共享包
```

RAG 相关页面：

| 页面 | 目录 | 说明 |
| --- | --- | --- |
| 文档管理 | `src/views/rag/documents` | 上传、查看、解析、索引、删除文档 |
| 文件预览 | `src/views/rag/documents/components` | 文档详情和文件预览 |
| 语义搜索 | `src/views/rag/search` | 相似度检索、排序、分页和命中位置展示 |
| 索引任务 | `src/views/rag/index-jobs` | 查看文档索引任务状态 |
| 知识库管理 | `src/views/rag/knowledge-base` | 管理知识库配置 |
| 问答 | `src/views/rag/qa` | 基于检索结果生成回答 |
| 评估 | `src/views/rag/evaluation` | 检索和问答质量评估 |

## API 客户端

RAG API 客户端位于：

```text
apps/frontend/apps/admin/src/api/rag/
```

主要文件：

| 文件 | 说明 |
| --- | --- |
| `http.ts` | RAG 后端请求封装 |
| `documents.ts` | 文档管理接口 |
| `search.ts` | 语义搜索接口 |
| `index-jobs.ts` | 索引任务接口 |
| `knowledge-base.ts` | 知识库接口 |
| `qa.ts` | 问答接口 |
| `evaluation.ts` | 评估接口 |
| `types.ts` | 前端 API 辅助类型 |

后端成功响应以 `code: 0` 判断，与后端 `ResponseInterceptor` 保持一致。请求和响应类型应优先来自 `@repo/shared-types`。

## 本地开发

先在仓库根目录启动基础设施和后端：

```bash
pnpm docker:up
pnpm dev:backend
```

然后启动前端：

```bash
pnpm dev:frontend
```

或进入前端目录启动：

```bash
cd apps/frontend
pnpm dev:admin
```

常用命令：

```bash
# 启动 admin 应用
pnpm dev:admin

# 构建 admin 应用
pnpm build:admin

# 类型检查
pnpm check

# 代码检查
pnpm lint
```

## 运行约定

- 后端 API 统一通过 `/api/*` 访问。
- 本地开发时 Vite 代理应转发到 NestJS 后端。
- 如果页面接口返回 502 或连接失败，优先检查 `pnpm dev:backend` 是否运行。
- 如果菜单数据异常或看不到新菜单，清理浏览器 localStorage 后重新登录。

## 开发规范

- 使用 Vue 3 Composition API 和 `<script setup lang="ts">`。
- 非简单状态使用 Pinia setup store。
- 页面级导航使用 Vue Router。
- 优先使用 Vben Admin 组件和适配器，例如 `@vben/common-ui`、`#/adapter/form`、`#/adapter/vxe-table`。
- Element Plus 可用于 Vben 没有覆盖的底层交互或业务组件。
- RAG 可复用组件优先沉淀到 `@repo/shared-ui`。
- API 合同和可序列化业务类型放在 `@repo/shared-types`。
- 前端不要依赖 `@repo/shared-backend`，也不要直接引入后端代码。
- 不要在页面中硬编码后端返回结构，优先复用共享类型和 API 封装。

## 与后端联调

文档上传与索引链路：

```text
前端上传文件 -> 后端保存文件 -> 后端抽取文本 -> 后端切片并生成向量 -> 前端轮询或刷新索引状态
```

语义搜索链路：

```text
用户输入关键词或问题 -> 前端调用 /api/search -> 后端返回命中文档、章节、条文、片段和相关度 -> 前端展示并支持排序分页
```

删除文档链路：

```text
用户确认删除 -> 前端调用文档删除接口 -> 后端删除文档记录、索引记录和本地上传文件 -> 前端刷新列表
```

## 注意事项

- `apps/frontend/README.md` 和 `README.zh-CN.md` 主要来自 Vben Admin 上游说明；本文件聚焦当前 RAG 项目的前端二次开发。
- 前端工作区要求的 Node 和 pnpm 版本可能与仓库根目录不同，遇到依赖安装问题时先检查 `apps/frontend/package.json` 中的 `engines`。
- 预览 DOCX、PDF 等文件依赖后端文件访问接口和浏览器侧预览组件，联调时需要同时确认文件存储路径、接口权限和 MIME 类型。
