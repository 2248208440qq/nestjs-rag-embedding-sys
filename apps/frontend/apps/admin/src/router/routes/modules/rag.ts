import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:database-zap',
      order: 10,
      title: '法律 RAG 知识库',
    },
    name: 'RagKnowledge',
    path: '/rag',
    children: [
      {
        component: () => import('#/views/rag/search/index.vue'),
        meta: {
          icon: 'lucide:search',
          title: '法律检索',
        },
        name: 'RagSearch',
        path: '/rag/search',
      },
      {
        component: () => import('#/views/rag/documents/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '法规文档',
        },
        name: 'RagDocuments',
        path: '/rag/documents',
      },
      {
        component: () => import('#/views/rag/index-jobs/index.vue'),
        meta: {
          icon: 'lucide:list-checks',
          title: '索引任务',
        },
        name: 'RagIndexJobs',
        path: '/rag/index-jobs',
      },
      {
        component: () => import('#/views/rag/evaluation/index.vue'),
        meta: {
          icon: 'lucide:chart-no-axes-combined',
          title: '检索评估',
        },
        name: 'RagEvaluation',
        path: '/rag/evaluation',
      },
      {
        component: () => import('#/views/rag/knowledge-base/index.vue'),
        meta: {
          icon: 'lucide:library-big',
          title: '知识库管理',
        },
        name: 'RagKnowledgeBase',
        path: '/rag/knowledge-base',
      },
      {
        component: () => import('#/views/rag/qa/index.vue'),
        meta: {
          icon: 'lucide:messages-square',
          title: '法律问答',
        },
        name: 'RagQa',
        path: '/rag/qa',
      },
      {
        component: () => import('#/views/rag/documents/detail.vue'),
        meta: {
          activeMenu: '/rag/documents',
          hideInMenu: true,
          title: '法规文档详情',
        },
        name: 'RagDocumentDetail',
        path: '/rag/documents/:id',
      },
    ],
  },
];

export default routes;
