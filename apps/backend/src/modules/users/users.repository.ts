import { Injectable } from '@nestjs/common';
import type { UserStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateUserDto, UpdateUserDto } from '@repo/shared-backend';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        dept: true,
      },
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    deptId?: string;
  }) {
    const { page, limit, search, status, deptId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { realName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (deptId) {
      where.deptId = deptId;
    }

    return Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: true } },
          dept: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  async create(input: CreateUserDto) {
    const { roleNames, ...data } = input;

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        realName: data.realName,
        homePath: data.homePath,
        status: (data.status as UserStatus) ?? 'active',
        deptId: data.deptId,
        roles: roleNames
          ? {
              create: roleNames.map((roleName) => ({
                role: { connect: { name: roleName } },
              })),
            }
          : undefined,
      },
      include: {
        roles: { include: { role: true } },
        dept: true,
      },
    });
  }

  async update(id: string, input: UpdateUserDto) {
    const { roleNames, ...data } = input;

    const updateData: any = { ...data };

    // If password is provided, hash it
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    if (data.status) {
      updateData.status = data.status as UserStatus;
    } else {
      delete updateData.status;
    }

    // If roleNames provided, replace roles
    if (roleNames) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        roles: roleNames
          ? {
              create: roleNames.map((roleName) => ({
                role: { connect: { name: roleName } },
              })),
            }
          : undefined,
      },
      include: {
        roles: { include: { role: true } },
        dept: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
