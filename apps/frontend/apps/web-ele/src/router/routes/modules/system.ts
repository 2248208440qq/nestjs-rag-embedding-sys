import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 20,
      title: '系统管理',
    },
    name: 'SystemManagement',
    path: '/system',
    children: [
      {
        component: () => import('#/views/system/users/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: '用户管理',
        },
        name: 'SystemUsers',
        path: '/system/user',
      },
      {
        component: () => import('#/views/system/roles/index.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: '角色管理',
        },
        name: 'SystemRoles',
        path: '/system/role',
      },
      {
        component: () => import('#/views/system/menus/index.vue'),
        meta: {
          icon: 'lucide:menu',
          title: '菜单管理',
        },
        name: 'SystemMenus',
        path: '/system/menu',
      },
      {
        component: () => import('#/views/system/depts/index.vue'),
        meta: {
          icon: 'lucide:building-2',
          title: '部门管理',
        },
        name: 'SystemDepts',
        path: '/system/dept',
      },
    ],
  },
];

export default routes;
