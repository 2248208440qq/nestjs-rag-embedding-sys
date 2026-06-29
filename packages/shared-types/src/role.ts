export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  menuIds?: string[];
  status: 'active' | 'inactive';
  permissions: string[];
  remark?: string;
  createTime: string;
}
