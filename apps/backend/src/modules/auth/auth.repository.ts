import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Data-access layer for authentication.
 *
 * RefreshToken storage has been migrated to Redis (see AuthService).
 * This repository now only handles user and permission-code queries.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                menus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                menus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findMenusByRoleIds(roleIds: string[]) {
    return this.prisma.roleMenu.findMany({
      where: { roleId: { in: roleIds } },
      include: { menu: true },
    });
  }
}
