import type { Prisma } from '@prisma/client';
import type { MenuItem, MenuMeta, MenuRecord } from '@repo/shared-types';

export interface MenuRow {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  component: string | null;
  icon: string | null;
  type: string;
  status: string;
  orderNo: number;
  meta: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  children?: MenuRow[];
}

export function toMenuTree(menus: MenuRow[]): MenuItem[] {
  return menus.map((menu) => {
    const meta: MenuMeta =
      typeof menu.meta === 'object' && menu.meta !== null
        ? (menu.meta as MenuMeta)
        : { title: menu.name };

    const item: MenuItem = {
      name: menu.name,
      path: menu.path,
      meta,
    };

    if (menu.component) {
      item.component = menu.component;
    }

    if (menu.children && menu.children.length > 0) {
      item.children = toMenuTree(menu.children);

      // Catalog menus without a component should redirect to the first child
      if (menu.type === 'catalog' && !menu.component && item.children.length > 0) {
        item.redirect = item.children[0]!.path;
      }
    }

    return item;
  });
}

export function toMenuRecordTree(menus: MenuRow[]): MenuRecord[] {
  return menus.map((menu) => {
    const meta: MenuMeta =
      typeof menu.meta === 'object' && menu.meta !== null
        ? (menu.meta as MenuMeta)
        : { title: menu.name };

    const record: MenuRecord = {
      id: menu.id,
      parentId: menu.parentId,
      name: menu.name,
      path: menu.path,
      component: menu.component ?? undefined,
      icon: menu.icon ?? undefined,
      type: menu.type as 'catalog' | 'menu' | 'button',
      status: menu.status as 'active' | 'inactive',
      orderNo: menu.orderNo,
      meta,
      createdAt: menu.createdAt.toISOString(),
      updatedAt: menu.updatedAt.toISOString(),
    };

    if (menu.children && menu.children.length > 0) {
      record.children = toMenuRecordTree(menu.children);
    }

    return record;
  });
}
