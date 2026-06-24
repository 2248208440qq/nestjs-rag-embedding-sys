export interface RoleRecord {
  id: string;
  menuIds?: string[];
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  permissions: string[];
  remark?: string;
  createTime: string;
}
