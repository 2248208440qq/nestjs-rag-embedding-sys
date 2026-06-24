import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { MenuType, MenuStatus } from '@prisma/client';
import type { UserInfo, MenuItem, MenuRecord } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { MenusRepository } from './menus.repository';
import { toMenuTree, toMenuRecordTree, type MenuRow } from './menus.mapper';

@Injectable()
export class MenusService {
  constructor(
    private readonly menusRepository: MenusRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getUserMenus(user: UserInfo): Promise<MenuItem[]> {
    // Resolve role names to role IDs
    const roles = await this.prisma.role.findMany({
      where: { name: { in: user.roles } },
      select: { id: true },
    });
    const roleIds = roles.map((r) => r.id);

    const menus = await this.menusRepository.findMenusByRoleIds(roleIds);
    return this.buildMenuTree(menus);
  }

  async getUserMenusByRoleIds(roleIds: string[]): Promise<MenuItem[]> {
    const menus = await this.menusRepository.findMenusByRoleIds(roleIds);
    return this.buildMenuTree(menus);
  }

  async getAllMenus(): Promise<MenuRecord[]> {
    const menus = await this.menusRepository.findAll();
    return toMenuRecordTree(menus);
  }

  async checkNameExists(name: string): Promise<boolean> {
    const menu = await this.menusRepository.findByName(name);
    return !!menu;
  }

  async checkPathExists(path: string): Promise<boolean> {
    const menu = await this.menusRepository.findByPath(path);
    return !!menu;
  }

  async create(data: {
    name: string;
    path: string;
    component?: string;
    icon?: string;
    type: MenuType;
    status?: MenuStatus;
    orderNo?: number;
    meta?: Record<string, unknown>;
    parentId?: string;
  }) {
    const existing = await this.menusRepository.findByName(data.name);
    if (existing) {
      throw new ConflictException('Menu name already exists');
    }
    return this.menusRepository.create(data);
  }

  async update(
    id: string,
    data: {
      name?: string;
      path?: string;
      component?: string;
      icon?: string;
      type?: MenuType;
      status?: MenuStatus;
      orderNo?: number;
      meta?: Record<string, unknown>;
      parentId?: string;
    },
  ) {
    const existing = await this.menusRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Menu ${id} was not found`);
    }
    return this.menusRepository.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.menusRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Menu ${id} was not found`);
    }
    return this.menusRepository.remove(id);
  }

  private buildMenuTree(flatMenus: MenuRow[]): MenuItem[] {
    type MenuNode = MenuRow & { children: MenuNode[] };
    const menuMap = new Map<string, MenuNode>();
    const roots: MenuNode[] = [];

    for (const menu of flatMenus) {
      menuMap.set(menu.id, { ...menu, children: [] });
    }

    for (const menu of flatMenus) {
      const node = menuMap.get(menu.id);
      if (!node) continue;
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return toMenuTree(roots);
  }
}
