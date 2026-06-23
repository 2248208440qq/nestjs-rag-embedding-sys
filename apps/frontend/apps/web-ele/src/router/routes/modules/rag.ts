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
