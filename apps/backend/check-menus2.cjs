const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. 查新菜单是否存在
  const newMenus = ['RagIndexJobs', 'RagEvaluation', 'RagKnowledgeBase', 'RagQa'];
  console.log('=== Check new menus exist ===');
  for (const name of newMenus) {
    const menu = await prisma.menu.findUnique({
      where: { name },
      select: { id: true, name: true, type: true, parentId: true },
    });
    console.log(`  ${name}: ${menu ? JSON.stringify({ id: menu.id, type: menu.type, parentId: menu.parentId }) : 'NOT FOUND'}`);
  }

  // 2. 查 admin 角色的 RoleMenu 是否包含这些菜单
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  console.log('\n=== admin RoleMenu for new menus ===');
  for (const name of newMenus) {
    const menu = await prisma.menu.findUnique({ where: { name } });
    if (!menu) continue;
    const rm = await prisma.roleMenu.findUnique({
      where: { roleId_menuId: { roleId: adminRole.id, menuId: menu.id } },
    });
    console.log(`  ${name}: RoleMenu ${rm ? 'EXISTS' : 'MISSING'}`);
  }

  // 3. 查 RagKnowledge catalog 的 RoleMenu
  const ragCatalog = await prisma.menu.findUnique({ where: { name: 'RagKnowledge' } });
  const catalogRm = await prisma.roleMenu.findUnique({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: ragCatalog.id } },
  });
  console.log(`\n  RagKnowledge catalog RoleMenu: ${catalogRm ? 'EXISTS' : 'MISSING'}`);

  // 4. 查 button 类型菜单的关联（这些不影响显示，但验证 seed 是否跑全）
  const buttonMenus = await prisma.menu.findMany({
    where: { type: 'button' },
    select: { id: true, name: true },
  });
  console.log(`\n=== Button menus count: ${buttonMenus.length} ===`);
  let buttonRmCount = 0;
  for (const btn of buttonMenus) {
    const rm = await prisma.roleMenu.findUnique({
      where: { roleId_menuId: { roleId: adminRole.id, menuId: btn.id } },
    });
    if (rm) buttonRmCount++;
  }
  console.log(`  Button RoleMenu for admin: ${buttonRmCount}/${buttonMenus.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
