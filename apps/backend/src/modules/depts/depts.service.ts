import { Injectable, NotFoundException } from '@nestjs/common';
import type { DeptStatus } from '@prisma/client';
import type { DeptRecord } from '@repo/shared-types';
import { DeptsRepository } from '@/modules/depts/depts.repository';

@Injectable()
export class DeptsService {
  constructor(private readonly deptsRepository: DeptsRepository) {}

  async findAll(): Promise<DeptRecord[]> {
    const depts = await this.deptsRepository.findAll();
    return this.toDeptTree(depts);
  }

  async create(data: {
    name: string;
    status?: DeptStatus;
    remark?: string;
    parentId?: string;
  }) {
    return this.deptsRepository.create(data);
  }

  async update(
    id: string,
    data: {
      name?: string;
      status?: DeptStatus;
      remark?: string;
      parentId?: string;
    },
  ) {
    const existing = await this.deptsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Dept ${id} was not found`);
    }
    return this.deptsRepository.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.deptsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Dept ${id} was not found`);
    }
    return this.deptsRepository.remove(id);
  }

  private toDeptTree(
    depts: Array<{
      id: string;
      parentId: string | null;
      name: string;
      status: string;
      remark: string | null;
      createdAt: Date;
      children?: unknown[];
    }>,
  ): DeptRecord[] {
    return depts.map((dept) => {
      const record: DeptRecord = {
        id: dept.id,
        pid: dept.parentId,
        name: dept.name,
        status: dept.status as 'active' | 'inactive',
        remark: dept.remark ?? undefined,
        createTime: dept.createdAt.toISOString(),
      };

      if (dept.children && dept.children.length > 0) {
        record.children = this.toDeptTree(
          dept.children as Parameters<typeof this.toDeptTree>[0],
        );
      }

      return record;
    });
  }
}
