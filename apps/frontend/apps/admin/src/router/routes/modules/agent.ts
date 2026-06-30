import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/agent/legal-assistant/index.vue'),
    meta: {
      icon: 'lucide:sparkles',
      order: 8,
      title: '法律助手',
    },
    name: 'LegalAssistant',
    path: '/agent',
  },
];

export default routes;
