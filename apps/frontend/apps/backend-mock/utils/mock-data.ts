export interface UserInfo {
  id: number;
  password: string;
  realName: string;
  roles: string[];
  username: string;
  homePath?: string;
}

export interface TimezoneOption {
  offset: number;
  timezone: string;
}

export const MOCK_USERS: UserInfo[] = [
  {
    id: 0,
    password: '123456',
    realName: 'Vben',
    roles: ['super'],
    username: 'vben',
  },
  {
    id: 1,
    password: '123456',
    realName: 'Admin',
    roles: ['admin'],
    username: 'admin',
    homePath: '/rag/search',
  },
  {
    id: 2,
    password: '123456',
    realName: 'Jack',
    roles: ['user'],
    username: 'jack',
    homePath: '/rag/search',
  },
];

export const MOCK_CODES = [
  // super
  {
    codes: ['AC_100100', 'AC_100110', 'AC_100120', 'AC_100010'],
    username: 'vben',
  },
  {
    // admin
    codes: ['AC_100010', 'AC_100020', 'AC_100030'],
    username: 'admin',
  },
  {
    // user
    codes: ['AC_1000001', 'AC_1000002'],
    username: 'jack',
  },
];

const ragMenus = [
  {
    meta: {
      icon: 'lucide:database-zap',
      order: 10,
      title: '法律 RAG 知识库',
    },
    name: 'RagKnowledge',
    path: '/rag',
    redirect: '/rag/search',
    children: [
      {
        name: 'RagSearch',
        path: '/rag/search',
        component: '/rag/search/index',
        meta: {
          icon: 'lucide:search',
          affixTab: true,
          title: '法律检索',
        },
      },
      {
        name: 'RagDocuments',
        path: '/rag/documents',
        component: '/rag/documents/index',
        meta: {
          icon: 'lucide:file-text',
          title: '法规文档',
        },
      },
    ],
  },
];

export const MOCK_MENUS = [
  {
    menus: [...ragMenus],
    username: 'vben',
  },
  {
    menus: [...ragMenus],
    username: 'admin',
  },
  {
    menus: [...ragMenus],
    username: 'jack',
  },
];

export const MOCK_MENU_LIST = [
  {
    id: 1,
    name: 'RagKnowledge',
    status: 1,
    type: 'catalog',
    icon: 'lucide:database-zap',
    path: '/rag',
    meta: {
      icon: 'lucide:database-zap',
      title: '法律 RAG 知识库',
      order: 10,
    },
    children: [
      {
        id: 101,
        pid: 1,
        path: '/rag/search',
        name: 'RagSearch',
        status: 1,
        type: 'menu',
        meta: {
          icon: 'lucide:search',
          title: '法律检索',
          affixTab: true,
        },
        component: '/rag/search/index',
      },
      {
        id: 102,
        pid: 1,
        path: '/rag/documents',
        name: 'RagDocuments',
        status: 1,
        type: 'menu',
        meta: {
          icon: 'lucide:file-text',
          title: '法规文档',
        },
        component: '/rag/documents/index',
      },
    ],
  },
];

export function getMenuIds(menus: any[]) {
  const ids: number[] = [];
  menus.forEach((item) => {
    ids.push(item.id);
    if (item.children && item.children.length > 0) {
      ids.push(...getMenuIds(item.children));
    }
  });
  return ids;
}

/**
 * 时区选项
 */
export const TIME_ZONE_OPTIONS: TimezoneOption[] = [
  {
    offset: -5,
    timezone: 'America/New_York',
  },
  {
    offset: 0,
    timezone: 'Europe/London',
  },
  {
    offset: 8,
    timezone: 'Asia/Shanghai',
  },
  {
    offset: 9,
    timezone: 'Asia/Tokyo',
  },
  {
    offset: 9,
    timezone: 'Asia/Seoul',
  },
];
