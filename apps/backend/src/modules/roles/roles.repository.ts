import { Injectable } from '@nestjs/common';
import type { RoleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRoleDto, UpdateRoleDto } from '@repo/shared-backend';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        menus: { include: { menu: true } },
        users: { include: { user: true } },
      },
    });
  }

  findByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }

  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    return Promise.all([
      this.prisma.role.findMany({
        where,
        include: {
          menus: { include: { menu: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.role.count({ where }),
    ]);
  }

  async create(input: CreateRoleDto) {
    const { menuIds, ...data } = input;

    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        status: (data.status as RoleStatus) ?? 'active',
        menus: menuIds
          ? {
              create: menuIds.map((menuId) => ({
                menu: { connect: { id: menuId } },
              })),
            }
          : undefined,
      },
      include: {
        menus: { include: { menu: true } },
      },
    });
  }

  async update(id: string, input: UpdateRoleDto) {
    const { menuIds, ...data } = input;

    if (menuIds) {
      await this.prisma.roleMenu.deleteMany({ where: { roleId: id } });
    }

    const updateData: any = { ...data };
    if (data.status) {
      updateData.status = data.status as RoleStatus;
    } else {
      delete updateData.status;
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...updateData,
        menus: menuIds
          ? {
              create: menuIds.map((menuId) => ({
                menu: { connect: { id: menuId } },
              })),
            }
          : undefined,
      },
      include: {
        menus: { include: { menu: true } },
      },
    });
  }

  remove(id: string) {
    return this.prisma.role.delete({
      where: { id },
    });
  }
}
