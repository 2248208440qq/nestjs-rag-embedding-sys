export interface MenuMeta {
  title: string;
  icon?: string;
  order?: number;
  affixTab?: boolean;
  [key: string]: any;
}

export interface MenuItem {
  name: string;
  path: string;
  component?: string;
  redirect?: string;
  meta: MenuMeta;
  children?: MenuItem[];
}

export interface MenuRecord {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  component?: string;
  icon?: string;
  type: 'catalog' | 'menu' | 'button';
  status: 'active' | 'inactive';
  orderNo: number;
  meta: MenuMeta;
  children?: MenuRecord[];
  createdAt: string;
  updatedAt: string;
}
