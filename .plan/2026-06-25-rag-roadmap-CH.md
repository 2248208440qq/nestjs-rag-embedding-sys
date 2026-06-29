# RAG 知识库路线计划

创建时间：2026-06-25
更新时间：2026-06-26 00:36:06

## 目标

将当前法律 RAG 知识库从“可上传、可检索”的文档系统，扩展为“可评估、可追踪、可运营、可问答”的法律知识平台。

核心扩展模块：

- `evaluation`：检索评估
- `index-jobs`：索引任务
- `knowledge-base`：知识库管理
- `qa`：法律问答

## 当前完成度

第一轮基础实现已经完成：

- [x] 新增 `packages/shared-types` 共享类型。
- [x] 新增四个 RAG 扩展模块对应的 Prisma schema 与 migration。
- [x] 新增后端模块：
  - `apps/backend/src/modules/evaluation`
  - `apps/backend/src/modules/index-jobs`
  - `apps/backend/src/modules/knowledge-base`
  - `apps/backend/src/modules/qa`
- [x] 将 `DocumentsService.extract/index/remove` 接入索引任务记录。
- [x] 新增前端 API：
  - `apps/frontend/apps/admin/src/api/rag/evaluation.ts`
  - `apps/frontend/apps/admin/src/api/rag/index-jobs.ts`
  - `apps/frontend/apps/admin/src/api/rag/knowledge-base.ts`
  - `apps/frontend/apps/admin/src/api/rag/qa.ts`
- [x] 新增前端页面：
  - `/rag/index-jobs`
  - `/rag/evaluation`
  - `/rag/knowledge-base`
  - `/rag/qa`
- [x] 更新 RAG 前端路由。
- [x] 更新 seed 菜单与权限。
- [x] 将 admin 中 `@repo/shared-types` 从 `file:` 改为 `link:`，避免前端读取旧类型副本。
- [x] 已通过验证：
  - `pnpm --filter @repo/shared-types build`
  - `pnpm --filter backend build`
  - `pnpm --filter backend prisma validate`
  - `pnpm --dir apps/frontend --filter @vben/admin typecheck`
  - `pnpm --dir apps/frontend --filter @vben/admin build`

当前阻塞：

- [ ] `pnpm --filter backend db:generate` 被 Windows Prisma engine DLL 文件锁阻塞。
  - 锁定文件：`query_engine-windows.dll.node`
  - 处理方式：停止正在运行的 Node / backend / Prisma 进程后重新执行。

## 阶段一：索引任务 index-jobs

目标：让解析、分块、向量化、重建索引、删除索引具备可观察、可重试、可追踪能力。

### 已完成

- [x] 新增 `index-jobs` 后端模块。
- [x] 新增 `IndexJob` Prisma 模型。
- [x] 新增索引任务共享类型。
- [x] 定义任务类型：
  - `parse_document`
  - `chunk_document`
  - `generate_embeddings`
  - `rebuild_document_index`
  - `rebuild_all_indexes`
  - `delete_document_index`
- [x] 定义任务状态：
  - `pending`
  - `running`
  - `succeeded`
  - `failed`
  - `canceled`
- [x] 文档解析、索引、删除流程会写入任务记录。
- [x] 新增接口：
  - 任务列表
  - 任务详情
  - 重试任务
  - 取消任务
  - 创建单文档重建索引任务
  - 创建全量重建索引任务
- [x] 新增前端索引任务页面。
- [x] 支持任务状态、任务类型筛选。
- [x] 支持查看进度、当前步骤、错误信息。

### 下一步

- [ ] 实现真正的异步 worker / queue。
- [ ] 让 `rebuild_document_index` 真正执行单文档重建索引。
- [ ] 让 `rebuild_all_indexes` 真正执行批量重建索引。
- [ ] 增加任务详情抽屉或弹窗。
- [ ] 增加日期范围、文档标题筛选。
- [ ] 在法规文档详情页增加“重建索引”按钮。
- [ ] 对“全量重建索引”增加确认弹窗。
- [ ] 增加幂等与并发防重复执行保护。
- [ ] 增加失败、重试、取消、删除清理相关测试。

## 阶段二：检索评估 evaluation

目标：让检索质量可量化、可对比、可解释。

### 已完成

- [x] 新增 `evaluation` 后端模块。
- [x] 新增评估用例模型：
  - query
  - 期望文档
  - 期望 chunk
  - 期望法条
  - 期望关键词
  - 难度
  - 标签
- [x] 新增评估运行模型：
  - case id
  - query
  - topK
  - search params
  - result snapshot
  - metrics
- [x] 新增接口：
  - 创建评估用例
  - 查询评估用例
  - 查询运行记录
  - 执行评估
- [x] 实现基础指标：
  - hit@K
  - recall@K
  - precision@K
  - MRR
  - 命中文档 / chunk / 法条列表
- [x] 新增前端检索评估页面。
- [x] 支持新增评估用例。
- [x] 支持运行单个评估用例。
- [x] 支持查看运行历史。

### 下一步

- [ ] 增加评估用例编辑 / 删除。
- [ ] 增加批量运行。
- [ ] 增加多次运行对比视图。
- [ ] 后端支持运行时调参后，暴露：
  - vector weight
  - keyword weight
  - RRF 参数
  - rerank 开关
- [ ] 在评估结果中展示 score 明细。
- [ ] 增加期望命中与实际命中的对照详情。
- [ ] 增加指标计算单元测试。
- [ ] 增加评估流程集成测试。

## 阶段三：知识库管理 knowledge-base

目标：让法律文档按领域、来源、状态、标签、效力等维度组织和运营。

### 已完成

- [x] 新增 `knowledge-base` 后端模块。
- [x] 新增 `KnowledgeBase` 和 `KnowledgeBaseDocument` Prisma 模型。
- [x] 支持知识库字段：
  - 名称
  - 编码
  - 描述
  - 分类
  - 状态
- [x] 新增接口：
  - 新增知识库
  - 修改知识库
  - 删除知识库
  - 查询知识库列表
  - 查询知识库详情
  - 绑定文档到知识库
- [x] 搜索接口支持 `knowledgeBaseIds` 过滤。
- [x] 新增前端知识库管理页面。
- [x] 支持知识库列表、新增、编辑、删除。
- [x] 增加 RBAC 权限码与 seed 菜单。

### 下一步

- [ ] 增加知识库详情页。
- [ ] 增加文档绑定 / 解绑 UI。
- [ ] 增加法律文档元数据表单：
  - 法律领域
  - 发布机关
  - 来源层级
  - 生效日期
  - 失效日期
  - 效力状态
- [ ] 增加标签模型、接口和 UI。
- [ ] 增加重复文档检测：
  - file hash
  - 标题规范化
  - 可选 source URL
- [ ] 前端检索页面增加知识库、法律领域、效力状态、标签筛选。
- [ ] 明确一个文档是否允许归属多个知识库，还是只允许一个主知识库。

## 阶段四：法律问答 qa

目标：在检索能力之上提供带引用、可追溯的法律问答。

### 已完成

- [x] 新增 `qa` 后端模块。
- [x] 新增 QA 共享类型：
  - question
  - knowledge base filter
  - topK
  - answer
  - citations
  - source chunks
  - retrieval trace id
- [x] 新增接口：
  - `POST /api/qa/ask`
- [x] 复用混合检索作为召回层。
- [x] 从检索结果生成引用来源。
- [x] 持久化 `QaTrace`。
- [x] 新增前端法律问答页面。
- [x] 支持输入问题、查看答案草稿、查看引用列表。

### 下一步

- [ ] 将当前“检索式答案草稿”升级为真正 LLM 生成。
- [ ] 增加 query normalization / query rewrite。
- [ ] 增加可选 rerank。
- [ ] 增加上下文压缩。
- [ ] 增加 prompt 模板管理。
- [ ] 增加引用校验：
  - 每个关键结论映射到 source chunk
  - 答案中暴露法规名称和条号
- [ ] 增加流式响应。
- [ ] 增加取消、重试状态。
- [ ] 增加 source chunk 预览。
- [ ] 前端增加知识库筛选。
- [ ] 增加复制答案、导出答案。
- [ ] 增加答案反馈：
  - 有帮助
  - 无帮助
  - 引用错误
  - 缺少法规

## 数据库可视化方案

当前 Docker 使用 `pgvector/pgvector:pg16` 作为 PostgreSQL 镜像，未包含 pgAdmin。

当前连接信息：

- Host：`127.0.0.1`
- Port：`15432`
- Database：`rag_embedding`
- Username：`rag`
- Password：`rag_password`
- Schema：`public`
- Connection string：`postgresql://rag:rag_password@127.0.0.1:15432/rag_embedding?schema=public`

当前容器状态已验证：

- PostgreSQL 容器：`rag-embedding-knowledge-postgres`
- 状态：healthy
- 端口映射：`0.0.0.0:15432 -> 5432`
- 宿主机端口连通：`127.0.0.1:15432` 可连接

### 推荐方案 A：使用本地已安装 pgAdmin

在本地 pgAdmin 中新建 Server：

- General / Name：`rag-embedding-local`
- Connection / Host name/address：`127.0.0.1`
- Connection / Port：`15432`
- Connection / Maintenance database：`rag_embedding`
- Connection / Username：`rag`
- Connection / Password：`rag_password`
- 勾选 Save password。

适用场景：

- 本机已有 pgAdmin。
- 只需要查看本项目 Docker PostgreSQL 数据库。
- 不想增加额外容器。

### 方案 B：在 docker-compose 中新增 pgAdmin 服务

可选新增服务：

```yaml
pgadmin:
  image: dpage/pgadmin4:latest
  container_name: rag-embedding-knowledge-pgadmin
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@rag.local
    PGADMIN_DEFAULT_PASSWORD: admin_password
  ports:
    - "18080:80"
  depends_on:
    postgres:
      condition: service_healthy
  restart: unless-stopped
```

容器内 pgAdmin 连接 PostgreSQL 时使用：

- Host：`postgres`
- Port：`5432`
- Database：`rag_embedding`
- Username：`rag`
- Password：`rag_password`

访问地址：

- `http://127.0.0.1:18080`

适用场景：

- 希望数据库管理工具也由 Docker 管理。
- 团队成员希望统一开发环境。

### 方案 C：使用 Prisma Studio

项目已有命令：

```bash
pnpm --filter backend prisma:studio
```

优点：

- 与 Prisma schema 对齐。
- 适合查看和编辑业务表。

限制：

- 不如 pgAdmin 适合查看扩展、索引、SQL 执行计划、pgvector 细节。

## 下一步推荐执行顺序

1. 先解决 Prisma generate 文件锁。
   - 停止 backend dev server 和占用 Prisma Client 的 Node 进程。
   - 执行：
     - `pnpm --filter backend db:generate`
     - `pnpm --filter backend db:migrate`
     - `pnpm --filter backend prisma:seed`

2. 完成 `index-jobs` 的真实执行语义。
   - 当前 rebuild 相关接口只创建任务记录。
   - 下一步要让任务可以真正执行重建索引。

3. 强化 `evaluation`。
   - 增加运行详情。
   - 展示 score breakdown。
   - 支持参数对比。

4. 深化 `knowledge-base`。
   - 做知识库详情。
   - 做文档绑定。
   - 做文档法律元数据。

5. 升级 `qa`。
   - 接入 LLM。
   - 增加引用校验。
   - 增加流式输出和答案反馈。

## 风险

- `rebuild-all` 当前只创建任务，不实际执行。
- Prisma generate 被 Windows DLL 文件锁阻塞时，后续 schema 类型可能不同步。
- QA 当前是检索式答案草稿，不是最终 LLM 问答。
- Evaluation 当前只有基础指标，尚不支持多参数对比。
- Knowledge base 元数据必须进入检索过滤和前端管理，否则只是装饰字段。
