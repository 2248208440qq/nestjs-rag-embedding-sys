import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { CreateRoleDto, UpdateRoleDto } from '@repo/shared-backend';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const [roles, total] = await this.rolesRepository.findAll(params);
    return {
      items: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        menuIds: role.menus.map((rm) => rm.menuId),
        status: role.status,
        permissions: role.menus.map((rm) => rm.menu.name),
        createTime: role.createdAt.toISOString(),
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async create(input: CreateRoleDto) {
    const existing = await this.rolesRepository.findByName(input.name);
    if (existing) {
      throw new ConflictException('Role name already exists');
    }
    const role = await this.rolesRepository.create(input);
    return role;
  }

  async update(id: string, input: UpdateRoleDto) {
    const existing = await this.rolesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Role ${id} was not found`);
    }
    return this.rolesRepository.update(id, input);
  }

  async remove(id: string) {
    const existing = await this.rolesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Role ${id} was not found`);
    }
    return this.rolesRepository.remove(id);
  }
}
