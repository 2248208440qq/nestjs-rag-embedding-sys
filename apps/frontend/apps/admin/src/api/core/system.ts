import type {
  DeptRecord,
  MenuMeta,
  MenuRecord,
  RoleRecord,
} from '@repo/shared-types';

import { requestClient } from '#/api/request';

export type { DeptRecord, MenuRecord, RoleRecord } from '@repo/shared-types';

export type Status = RoleRecord['status'];
export type MenuType = MenuRecord['type'];

export interface PageResult<T> {
  items: T[];
  limit: number;
  page: number;
  total: number;
}

export interface UserRecord {
  avatar?: string | null;
  createTime: string;
  deptId?: string | null;
  deptName?: null | string;
  homePath?: null | string;
  id: string;
  realName?: null | string;
  roles: Array<{ description?: null | string; name: string }>;
  status: Status;
  username: string;
}

export interface UserPayload {
  deptId?: string;
  homePath?: string;
  password?: string;
  realName?: string;
  roleNames?: string[];
  status?: Status;
  username?: string;
}

export interface RolePayload {
  description?: string;
  menuIds?: string[];
  name?: string;
  status?: Status;
}

export interface MenuPayload {
  component?: string;
  icon?: string;
  meta?: Partial<MenuMeta>;
  name?: string;
  orderNo?: number;
  parentId?: string;
  path?: string;
  status?: Status;
  type?: MenuType;
}

export interface DeptPayload {
  name?: string;
  parentId?: string;
  remark?: string;
  status?: Status;
}

export function getUserListApi(params: Record<string, any>) {
  return requestClient.get<PageResult<UserRecord>>('/system/user/list', {
    params,
  });
}

export function createUserApi(data: UserPayload) {
  return requestClient.post<UserRecord>('/system/user', data);
}

export function updateUserApi(id: string, data: UserPayload) {
  return requestClient.request<UserRecord>(`/system/user/${id}`, {
    data,
    method: 'PATCH',
  });
}

export function deleteUserApi(id: string) {
  return requestClient.delete(`/system/user/${id}`);
}

export function getRoleListApi(params: Record<string, any>) {
  return requestClient.get<PageResult<RoleRecord>>('/system/role/list', {
    params,
  });
}

export function createRoleApi(data: RolePayload) {
  return requestClient.post<RoleRecord>('/system/role', data);
}

export function updateRoleApi(id: string, data: RolePayload) {
  return requestClient.request<RoleRecord>(`/system/role/${id}`, {
    data,
    method: 'PATCH',
  });
}

export function deleteRoleApi(id: string) {
  return requestClient.delete(`/system/role/${id}`);
}

export function getMenuListApi() {
  return requestClient.get<MenuRecord[]>('/system/menu/list');
}

export function createMenuApi(data: MenuPayload) {
  return requestClient.post<MenuRecord>('/system/menu', data);
}

export function updateMenuApi(id: string, data: MenuPayload) {
  return requestClient.request<MenuRecord>(`/system/menu/${id}`, {
    data,
    method: 'PATCH',
  });
}

export function deleteMenuApi(id: string) {
  return requestClient.delete(`/system/menu/${id}`);
}

export function getDeptListApi() {
  return requestClient.get<DeptRecord[]>('/system/dept/list');
}

export function createDeptApi(data: DeptPayload) {
  return requestClient.post<DeptRecord>('/system/dept', data);
}

export function updateDeptApi(id: string, data: DeptPayload) {
  return requestClient.put<DeptRecord>(`/system/dept/${id}`, data);
}

export function deleteDeptApi(id: string) {
  return requestClient.delete(`/system/dept/${id}`);
}
