import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const upsertButtonPermission = async (input: {
    name: string;
    path: string;
    parentId: string;
    title: string;
    orderNo?: number;
  }) => {
    return prisma.menu.upsert({
      where: { name: input.name },
      update: {
        path: input.path,
        type: 'button',
        status: 'active',
        orderNo: input.orderNo ?? 0,
        parentId: input.parentId,
        meta: { title: input.title },
      },
      create: {
        name: input.name,
        path: input.path,
        type: 'button',
        status: 'active',
        orderNo: input.orderNo ?? 0,
        parentId: input.parentId,
        meta: { title: input.title },
      },
    });
  };

  // 1. Create menus
  const ragCatalog = await prisma.menu.upsert({
    where: { name: 'RagKnowledge' },
    update: {},
    create: {
      name: 'RagKnowledge',
      path: '/rag',
      icon: 'lucide:database-zap',
      type: 'catalog',
      status: 'active',
      orderNo: 10,
      meta: {
        icon: 'lucide:database-zap',
        title: '法律 RAG 知识库',
        order: 10,
      },
    },
  });

  const ragSearchMenu = await prisma.menu.upsert({
    where: { name: 'RagSearch' },
    update: {},
    create: {
      name: 'RagSearch',
      path: '/rag/search',
      component: '/rag/search/index',
      type: 'menu',
      status: 'active',
      orderNo: 1,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:search',
        title: '法律检索',
        affixTab: true,
      },
    },
  });

  const ragDocumentsMenu = await prisma.menu.upsert({
    where: { name: 'RagDocuments' },
    update: {},
    create: {
      name: 'RagDocuments',
      path: '/rag/documents',
      component: '/rag/documents/index',
      type: 'menu',
      status: 'active',
      orderNo: 2,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:file-text',
        title: '法规文档',
      },
    },
  });

  const ragDocumentDetailMenu = await prisma.menu.upsert({
    where: { name: 'RagDocumentDetail' },
    update: {
      path: '/rag/documents/:id',
      component: '/rag/documents/detail',
      type: 'menu',
      status: 'active',
      orderNo: 3,
      parentId: ragCatalog.id,
      meta: {
        activeMenu: '/rag/documents',
        hideInMenu: true,
        title: '\u6cd5\u89c4\u6587\u6863\u8be6\u60c5',
      },
    },
    create: {
      name: 'RagDocumentDetail',
      path: '/rag/documents/:id',
      component: '/rag/documents/detail',
      type: 'menu',
      status: 'active',
      orderNo: 3,
      parentId: ragCatalog.id,
      meta: {
        activeMenu: '/rag/documents',
        hideInMenu: true,
        title: '\u6cd5\u89c4\u6587\u6863\u8be6\u60c5',
      },
    },
  });

  const ragIndexJobsMenu = await prisma.menu.upsert({
    where: { name: 'RagIndexJobs' },
    update: {
      path: '/rag/index-jobs',
      component: '/rag/index-jobs/index',
      type: 'menu',
      status: 'active',
      orderNo: 3,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:list-checks',
        title: '\u7d22\u5f15\u4efb\u52a1',
      },
    },
    create: {
      name: 'RagIndexJobs',
      path: '/rag/index-jobs',
      component: '/rag/index-jobs/index',
      type: 'menu',
      status: 'active',
      orderNo: 3,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:list-checks',
        title: '\u7d22\u5f15\u4efb\u52a1',
      },
    },
  });

  const ragEvaluationMenu = await prisma.menu.upsert({
    where: { name: 'RagEvaluation' },
    update: {
      path: '/rag/evaluation',
      component: '/rag/evaluation/index',
      type: 'menu',
      status: 'active',
      orderNo: 4,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:chart-no-axes-combined',
        title: '\u68c0\u7d22\u8bc4\u4f30',
      },
    },
    create: {
      name: 'RagEvaluation',
      path: '/rag/evaluation',
      component: '/rag/evaluation/index',
      type: 'menu',
      status: 'active',
      orderNo: 4,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:chart-no-axes-combined',
        title: '\u68c0\u7d22\u8bc4\u4f30',
      },
    },
  });

  const ragKnowledgeBaseMenu = await prisma.menu.upsert({
    where: { name: 'RagKnowledgeBase' },
    update: {
      path: '/rag/knowledge-base',
      component: '/rag/knowledge-base/index',
      type: 'menu',
      status: 'active',
      orderNo: 5,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:library-big',
        title: '\u77e5\u8bc6\u5e93\u7ba1\u7406',
      },
    },
    create: {
      name: 'RagKnowledgeBase',
      path: '/rag/knowledge-base',
      component: '/rag/knowledge-base/index',
      type: 'menu',
      status: 'active',
      orderNo: 5,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:library-big',
        title: '\u77e5\u8bc6\u5e93\u7ba1\u7406',
      },
    },
  });

  const ragQaMenu = await prisma.menu.upsert({
    where: { name: 'RagQa' },
    update: {
      path: '/rag/qa',
      component: '/rag/qa/index',
      type: 'menu',
      status: 'active',
      orderNo: 6,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:messages-square',
        title: '\u6cd5\u5f8b\u95ee\u7b54',
      },
    },
    create: {
      name: 'RagQa',
      path: '/rag/qa',
      component: '/rag/qa/index',
      type: 'menu',
      status: 'active',
      orderNo: 6,
      parentId: ragCatalog.id,
      meta: {
        icon: 'lucide:messages-square',
        title: '\u6cd5\u5f8b\u95ee\u7b54',
      },
    },
  });
  // Button-level permissions
  const uploadButton = await upsertButtonPermission({
    name: 'rag:document:upload',
    path: '/rag/documents/upload',
    parentId: ragDocumentsMenu.id,
    title: '上传文档',
  });

  const deleteButton = await upsertButtonPermission({
    name: 'rag:document:delete',
    path: '/rag/documents/delete',
    parentId: ragDocumentsMenu.id,
    title: '删除文档',
  });

  const parseButton = await upsertButtonPermission({
    name: 'rag:document:parse',
    path: '/rag/documents/parse',
    parentId: ragDocumentsMenu.id,
    title: '解析文档',
  });

  const indexButton = await upsertButtonPermission({
    name: 'rag:document:index',
    path: '/rag/documents/index',
    parentId: ragDocumentsMenu.id,
    title: '更新索引',
  });

  const searchButton = await upsertButtonPermission({
    name: 'rag:search:query',
    path: '/rag/search',
    parentId: ragSearchMenu.id,
    title: '法律检索',
  });

  const indexJobRebuildButton = await upsertButtonPermission({
    name: 'rag:index-job:rebuild',
    path: '/rag/index-jobs/rebuild',
    parentId: ragIndexJobsMenu.id,
    title: '\u91cd\u5efa\u7d22\u5f15',
  });

  const indexJobRetryButton = await upsertButtonPermission({
    name: 'rag:index-job:retry',
    path: '/rag/index-jobs/retry',
    parentId: ragIndexJobsMenu.id,
    title: '\u91cd\u8bd5\u7d22\u5f15\u4efb\u52a1',
  });

  const indexJobCancelButton = await upsertButtonPermission({
    name: 'rag:index-job:cancel',
    path: '/rag/index-jobs/cancel',
    parentId: ragIndexJobsMenu.id,
    title: '\u53d6\u6d88\u7d22\u5f15\u4efb\u52a1',
  });

  const evaluationCreateButton = await upsertButtonPermission({
    name: 'rag:evaluation:create',
    path: '/rag/evaluation/create',
    parentId: ragEvaluationMenu.id,
    title: '\u65b0\u589e\u8bc4\u4f30\u7528\u4f8b',
  });

  const evaluationRunButton = await upsertButtonPermission({
    name: 'rag:evaluation:run',
    path: '/rag/evaluation/run',
    parentId: ragEvaluationMenu.id,
    title: '\u8fd0\u884c\u68c0\u7d22\u8bc4\u4f30',
  });

  const knowledgeBaseCreateButton = await upsertButtonPermission({
    name: 'rag:knowledge-base:create',
    path: '/rag/knowledge-base/create',
    parentId: ragKnowledgeBaseMenu.id,
    title: '\u65b0\u589e\u77e5\u8bc6\u5e93',
  });

  const knowledgeBaseUpdateButton = await upsertButtonPermission({
    name: 'rag:knowledge-base:update',
    path: '/rag/knowledge-base/update',
    parentId: ragKnowledgeBaseMenu.id,
    title: '\u4fee\u6539\u77e5\u8bc6\u5e93',
  });

  const knowledgeBaseDeleteButton = await upsertButtonPermission({
    name: 'rag:knowledge-base:delete',
    path: '/rag/knowledge-base/delete',
    parentId: ragKnowledgeBaseMenu.id,
    title: '\u5220\u9664\u77e5\u8bc6\u5e93',
  });

  const qaAskButton = await upsertButtonPermission({
    name: 'rag:qa:ask',
    path: '/rag/qa/ask',
    parentId: ragQaMenu.id,
    title: '\u6cd5\u5f8b\u95ee\u7b54',
  });

  const systemCatalog = await prisma.menu.upsert({
    where: { name: 'SystemManagement' },
    update: {
      path: '/system',
      icon: 'lucide:settings',
      type: 'catalog',
      status: 'active',
      orderNo: 20,
      parentId: null,
      meta: {
        icon: 'lucide:settings',
        order: 20,
        title: '\u7cfb\u7edf\u7ba1\u7406',
      },
    },
    create: {
      name: 'SystemManagement',
      path: '/system',
      icon: 'lucide:settings',
      type: 'catalog',
      status: 'active',
      orderNo: 20,
      meta: {
        icon: 'lucide:settings',
        order: 20,
        title: '\u7cfb\u7edf\u7ba1\u7406',
      },
    },
  });

  const userMgmtMenu = await prisma.menu.upsert({
    where: { name: 'SystemUsers' },
    update: {
      component: '/system/users/index',
      icon: 'lucide:users',
      parentId: systemCatalog.id,
      path: '/system/user',
      type: 'menu',
      status: 'active',
      orderNo: 1,
      meta: {
        icon: 'lucide:users',
        title: '\u7528\u6237\u7ba1\u7406',
      },
    },
    create: {
      name: 'SystemUsers',
      path: '/system/user',
      component: '/system/users/index',
      icon: 'lucide:users',
      type: 'menu',
      status: 'active',
      orderNo: 1,
      parentId: systemCatalog.id,
      meta: {
        icon: 'lucide:users',
        title: '\u7528\u6237\u7ba1\u7406',
      },
    },
  });

  const roleMgmtMenu = await prisma.menu.upsert({
    where: { name: 'SystemRoles' },
    update: {
      component: '/system/roles/index',
      icon: 'lucide:shield-check',
      parentId: systemCatalog.id,
      path: '/system/role',
      type: 'menu',
      status: 'active',
      orderNo: 2,
      meta: {
        icon: 'lucide:shield-check',
        title: '\u89d2\u8272\u7ba1\u7406',
      },
    },
    create: {
      name: 'SystemRoles',
      path: '/system/role',
      component: '/system/roles/index',
      icon: 'lucide:shield-check',
      type: 'menu',
      status: 'active',
      orderNo: 2,
      parentId: systemCatalog.id,
      meta: {
        icon: 'lucide:shield-check',
        title: '\u89d2\u8272\u7ba1\u7406',
      },
    },
  });

  const menuMgmtMenu = await prisma.menu.upsert({
    where: { name: 'SystemMenus' },
    update: {
      component: '/system/menus/index',
      icon: 'lucide:menu',
      parentId: systemCatalog.id,
      path: '/system/menu',
      type: 'menu',
      status: 'active',
      orderNo: 3,
      meta: {
        icon: 'lucide:menu',
        title: '\u83dc\u5355\u7ba1\u7406',
      },
    },
    create: {
      name: 'SystemMenus',
      path: '/system/menu',
      component: '/system/menus/index',
      icon: 'lucide:menu',
      type: 'menu',
      status: 'active',
      orderNo: 3,
      parentId: systemCatalog.id,
      meta: {
        icon: 'lucide:menu',
        title: '\u83dc\u5355\u7ba1\u7406',
      },
    },
  });

  const deptMgmtMenu = await prisma.menu.upsert({
    where: { name: 'SystemDepts' },
    update: {
      component: '/system/depts/index',
      icon: 'lucide:building-2',
      parentId: systemCatalog.id,
      path: '/system/dept',
      type: 'menu',
      status: 'active',
      orderNo: 4,
      meta: {
        icon: 'lucide:building-2',
        title: '\u90e8\u95e8\u7ba1\u7406',
      },
    },
    create: {
      name: 'SystemDepts',
      path: '/system/dept',
      component: '/system/depts/index',
      icon: 'lucide:building-2',
      type: 'menu',
      status: 'active',
      orderNo: 4,
      parentId: systemCatalog.id,
      meta: {
        icon: 'lucide:building-2',
        title: '\u90e8\u95e8\u7ba1\u7406',
      },
    },
  });

  const userCreateButton = await upsertButtonPermission({
    name: 'system:user:create',
    path: '/system/user/create',
    parentId: userMgmtMenu.id,
    title: '新增用户',
  });

  const userUpdateButton = await upsertButtonPermission({
    name: 'system:user:update',
    path: '/system/user/update',
    parentId: userMgmtMenu.id,
    title: '修改用户',
  });

  const userDeleteButton = await upsertButtonPermission({
    name: 'system:user:delete',
    path: '/system/user/delete',
    parentId: userMgmtMenu.id,
    title: '删除用户',
  });

  const roleCreateButton = await upsertButtonPermission({
    name: 'system:role:create',
    path: '/system/role/create',
    parentId: roleMgmtMenu.id,
    title: '新增角色',
  });

  const roleUpdateButton = await upsertButtonPermission({
    name: 'system:role:update',
    path: '/system/role/update',
    parentId: roleMgmtMenu.id,
    title: '修改角色',
  });

  const roleDeleteButton = await upsertButtonPermission({
    name: 'system:role:delete',
    path: '/system/role/delete',
    parentId: roleMgmtMenu.id,
    title: '删除角色',
  });

  const menuCreateButton = await upsertButtonPermission({
    name: 'system:menu:create',
    path: '/system/menu/create',
    parentId: menuMgmtMenu.id,
    title: '新增菜单',
  });

  const menuUpdateButton = await upsertButtonPermission({
    name: 'system:menu:update',
    path: '/system/menu/update',
    parentId: menuMgmtMenu.id,
    title: '修改菜单',
  });

  const menuDeleteButton = await upsertButtonPermission({
    name: 'system:menu:delete',
    path: '/system/menu/delete',
    parentId: menuMgmtMenu.id,
    title: '删除菜单',
  });

  const deptCreateButton = await upsertButtonPermission({
    name: 'system:dept:create',
    path: '/system/dept/create',
    parentId: deptMgmtMenu.id,
    title: '新增部门',
  });

  const deptUpdateButton = await upsertButtonPermission({
    name: 'system:dept:update',
    path: '/system/dept/update',
    parentId: deptMgmtMenu.id,
    title: '修改部门',
  });

  const deptDeleteButton = await upsertButtonPermission({
    name: 'system:dept:delete',
    path: '/system/dept/delete',
    parentId: deptMgmtMenu.id,
    title: '删除部门',
  });

  await prisma.menu.deleteMany({
    where: {
      name: {
        in: [
          'AC_100010',
          'AC_100020',
          'AC_100030',
          'AC_100040',
          'AC_100050',
          'AC_100100',
          'AC_100110',
          'AC_100120',
        ],
      },
    },
  });

  // 2. Create roles
  const superRole = await prisma.role.upsert({
    where: { name: 'super' },
    update: {},
    create: {
      name: 'super',
      description: 'Super administrator with full access',
      status: 'active',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with management access',
      status: 'active',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with basic access',
      status: 'active',
    },
  });

  // 3. Assign menus to roles
  const allMenus = [
    ragCatalog,
    ragSearchMenu,
    ragDocumentsMenu,
    ragIndexJobsMenu,
    ragEvaluationMenu,
    ragKnowledgeBaseMenu,
    ragQaMenu,
    ragDocumentDetailMenu,
    uploadButton,
    deleteButton,
    parseButton,
    indexButton,
    searchButton,
    indexJobRebuildButton,
    indexJobRetryButton,
    indexJobCancelButton,
    evaluationCreateButton,
    evaluationRunButton,
    knowledgeBaseCreateButton,
    knowledgeBaseUpdateButton,
    knowledgeBaseDeleteButton,
    qaAskButton,
    systemCatalog,
    userMgmtMenu,
    roleMgmtMenu,
    menuMgmtMenu,
    deptMgmtMenu,
    userCreateButton,
    userUpdateButton,
    userDeleteButton,
    roleCreateButton,
    roleUpdateButton,
    roleDeleteButton,
    menuCreateButton,
    menuUpdateButton,
    menuDeleteButton,
    deptCreateButton,
    deptUpdateButton,
    deptDeleteButton,
  ];

  // Super role gets all menus
  for (const menu of allMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: { roleId: superRole.id, menuId: menu.id },
      },
      update: {},
      create: { roleId: superRole.id, menuId: menu.id },
    });
  }

  // Admin role gets RAG menus + some system buttons
  const adminMenus = [
    ragCatalog,
    ragSearchMenu,
    ragDocumentsMenu,
    ragIndexJobsMenu,
    ragEvaluationMenu,
    ragKnowledgeBaseMenu,
    ragQaMenu,
    ragDocumentDetailMenu,
    uploadButton,
    deleteButton,
    parseButton,
    indexButton,
    searchButton,
    indexJobRebuildButton,
    indexJobRetryButton,
    indexJobCancelButton,
    evaluationCreateButton,
    evaluationRunButton,
    knowledgeBaseCreateButton,
    knowledgeBaseUpdateButton,
    knowledgeBaseDeleteButton,
    qaAskButton,
    systemCatalog,
    userMgmtMenu,
    roleMgmtMenu,
    menuMgmtMenu,
    deptMgmtMenu,
    userCreateButton,
    userUpdateButton,
    userDeleteButton,
    roleCreateButton,
    roleUpdateButton,
    roleDeleteButton,
    menuCreateButton,
    menuUpdateButton,
    menuDeleteButton,
    deptCreateButton,
    deptUpdateButton,
    deptDeleteButton,
  ];
  for (const menu of adminMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: { roleId: adminRole.id, menuId: menu.id },
      },
      update: {},
      create: { roleId: adminRole.id, menuId: menu.id },
    });
  }

  // User role gets basic RAG menus
  const userMenus = [
    ragCatalog,
    ragSearchMenu,
    ragDocumentsMenu,
    ragEvaluationMenu,
    ragQaMenu,
    ragDocumentDetailMenu,
    searchButton,
    evaluationRunButton,
    qaAskButton,
  ];
  for (const menu of userMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: { roleId: userRole.id, menuId: menu.id },
      },
      update: {},
      create: { roleId: userRole.id, menuId: menu.id },
    });
  }

  // 4. Create users
  // Admin password is 123456789, others use 123456
  const adminHashedPassword = await bcrypt.hash('123456789', 10);
  const defaultHashedPassword = await bcrypt.hash('123456', 10);

  const vbenUser = await prisma.user.upsert({
    where: { username: 'vben' },
    update: {},
    create: {
      username: 'vben',
      password: defaultHashedPassword,
      realName: 'Vben',
      homePath: '/rag/search',
      status: 'active',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminHashedPassword },
    create: {
      username: 'admin',
      password: adminHashedPassword,
      realName: 'Admin',
      homePath: '/rag/search',
      status: 'active',
    },
  });

  const jackUser = await prisma.user.upsert({
    where: { username: 'jack' },
    update: {},
    create: {
      username: 'jack',
      password: defaultHashedPassword,
      realName: 'Jack',
      homePath: '/rag/search',
      status: 'active',
    },
  });

  // 5. Assign roles to users
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: vbenUser.id, roleId: superRole.id } },
    update: {},
    create: { userId: vbenUser.id, roleId: superRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: jackUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: jackUser.id, roleId: userRole.id },
  });

  console.log('Seed completed successfully!');
  console.log('Users: vben/123456 (super), admin/123456789 (admin), jack/123456 (user)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
