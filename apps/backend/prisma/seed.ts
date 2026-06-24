import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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

  // Button-level permissions
  const uploadButton = await prisma.menu.upsert({
    where: { name: 'AC_100100' },
    update: {},
    create: {
      name: 'AC_100100',
      path: '/rag/documents/upload',
      type: 'button',
      status: 'active',
      orderNo: 0,
      parentId: ragDocumentsMenu.id,
      meta: { title: '上传文档' },
    },
  });

  const deleteButton = await prisma.menu.upsert({
    where: { name: 'AC_100110' },
    update: {},
    create: {
      name: 'AC_100110',
      path: '/rag/documents/delete',
      type: 'button',
      status: 'active',
      orderNo: 0,
      parentId: ragDocumentsMenu.id,
      meta: { title: '删除文档' },
    },
  });

  const searchButton = await prisma.menu.upsert({
    where: { name: 'AC_100120' },
    update: {},
    create: {
      name: 'AC_100120',
      path: '/rag/search/advanced',
      type: 'button',
      status: 'active',
      orderNo: 0,
      parentId: ragSearchMenu.id,
      meta: { title: '高级检索' },
    },
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
        title: 'System Permission',
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
        title: 'System Permission',
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
        title: 'System Permission',
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
        title: 'System Permission',
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
        title: 'System Permission',
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
        title: 'System Permission',
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
        title: 'System Permission',
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
        title: 'System Permission',
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
        title: 'System Permission',
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
        title: 'System Permission',
      },
    },
  });

  const userMgmtButton = await prisma.menu.upsert({
    where: { name: 'AC_100020' },
    update: { parentId: userMgmtMenu.id },
    create: {
      name: 'AC_100020',
      path: '/system/user',
      type: 'button',
      status: 'active',
      orderNo: 0,
      parentId: userMgmtMenu.id,
      meta: { title: 'User Management' },
    },
  });

  const roleMgmtButton = await prisma.menu.upsert({
    where: { name: 'AC_100030' },
    update: { parentId: roleMgmtMenu.id },
    create: {
      name: 'AC_100030',
      path: '/system/role',
      type: 'button',
      status: 'active',
      orderNo: 0,
      parentId: roleMgmtMenu.id,
      meta: { title: 'Role Management' },
    },
  });

  const menuMgmtButton = await prisma.menu.upsert({
    where: { name: 'AC_100040' },
    update: { parentId: menuMgmtMenu.id },
    create: {
      name: 'AC_100040',
      path: '/system/menu',
      type: 'button',
      status: 'active',
      orderNo: 0,
      parentId: menuMgmtMenu.id,
      meta: { title: 'Menu Management' },
    },
  });

  const deptMgmtButton = await prisma.menu.upsert({
    where: { name: 'AC_100050' },
    update: { parentId: deptMgmtMenu.id },
    create: {
      name: 'AC_100050',
      path: '/system/dept',
      type: 'button',
      status: 'active',
      orderNo: 0,
      parentId: deptMgmtMenu.id,
      meta: { title: 'Department Management' },
    },
  });

  await prisma.menu.deleteMany({ where: { name: 'AC_100010' } });

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
    uploadButton,
    deleteButton,
    searchButton,
    systemCatalog,
    userMgmtMenu,
    roleMgmtMenu,
    menuMgmtMenu,
    deptMgmtMenu,
    userMgmtButton,
    roleMgmtButton,
    menuMgmtButton,
    deptMgmtButton,
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
    uploadButton,
    deleteButton,
    systemCatalog,
    userMgmtMenu,
    roleMgmtMenu,
    menuMgmtMenu,
    deptMgmtMenu,
    userMgmtButton,
    roleMgmtButton,
    menuMgmtButton,
    deptMgmtButton,
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
  const userMenus = [ragCatalog, ragSearchMenu, ragDocumentsMenu];
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
