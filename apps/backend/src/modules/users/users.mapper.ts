import type { UserInfo } from '@repo/shared-types';

interface UserWithRelations {
  id: string;
  username: string;
  password: string;
  realName: string | null;
  homePath: string | null;
  avatar: string | null;
  status: string;
  deptId: string | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    role: { name: string; description: string | null; status: string };
  }>;
  dept?: {
    id: string;
    name: string;
  } | null;
}

export function toUserInfo(user: UserWithRelations): UserInfo {
  return {
    id: user.id,
    username: user.username,
    realName: user.realName,
    roles: user.roles.map((ur) => ur.role.name),
    homePath: user.homePath ?? undefined,
    avatar: user.avatar ?? undefined,
  };
}

export function toUserRecord(user: UserWithRelations) {
  return {
    id: user.id,
    username: user.username,
    realName: user.realName,
    homePath: user.homePath,
    avatar: user.avatar,
    status: user.status,
    deptId: user.deptId,
    deptName: user.dept?.name ?? null,
    roles: user.roles.map((ur) => ({
      name: ur.role.name,
      description: ur.role.description,
    })),
    createTime: user.createdAt.toISOString(),
  };
}
