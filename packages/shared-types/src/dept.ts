export interface DeptRecord {
  id: string;
  pid: string | null;
  name: string;
  status: 'active' | 'inactive';
  remark?: string;
  createTime: string;
  children?: DeptRecord[];
}
