import { Injectable } from '@nestjs/common';
import type { MenuType, MenuStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class MenusRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.menu.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.menu.findUnique({ where: { name } });
  }

  findByPath(path: string) {
    return this.prisma.menu.findFirst({ where: { path } });
  }

  findAll() {
    return this.prisma.menu.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
          orderBy: { orderNo: 'asc' },
        },
      },
      orderBy: { orderNo: 'asc' },
    });
  }

  findByRoleIds(roleIds: string[]) {
    return this.prisma.roleMenu.findMany({
      where: { roleId: { in: roleIds } },
      include: { menu: true },
    });
  }

  async findMenusByRoleIds(roleIds: string[]) {
    const roleMenus = await this.findByRoleIds(roleIds);
    const menuIds = [
      ...new Set(
        roleMenus
          .filter((rm) => rm.menu.status === 'active')
          .map((rm) => rm.menuId),
      ),
    ];

    const menus = await this.prisma.menu.findMany({
      where: {
        id: { in: menuIds },
        status: 'active',
        type: { in: ['catalog', 'menu'] },
      },
      orderBy: { orderNo: 'asc' },
    });

    return menus;
  }

  create(data: {
    name: string;
    path: string;
    component?: string;
    icon?: string;
    type: MenuType;
    status?: MenuStatus;
    orderNo?: number;
    meta?: any;
    parentId?: string;
  }) {
    return this.prisma.menu.create({ data });
  }

  update(
    id: string,
    data: {
      name?: string;
      path?: string;
      component?: string;
      icon?: string;
      type?: MenuType;
      status?: MenuStatus;
      orderNo?: number;
      meta?: any;
      parentId?: string;
    },
  ) {
    return this.prisma.menu.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.menu.delete({ where: { id } });
  }
}
