import { Injectable } from '@nestjs/common';
import type { DeptStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.dept.findUnique({ where: { id } });
  }

  findAll() {
    return this.prisma.dept.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: {
    name: string;
    status?: DeptStatus;
    remark?: string;
    parentId?: string;
  }) {
    return this.prisma.dept.create({ data });
  }

  update(
    id: string,
    data: {
      name?: string;
      status?: DeptStatus;
      remark?: string;
      parentId?: string;
    },
  ) {
    return this.prisma.dept.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.dept.delete({ where: { id } });
  }
}
