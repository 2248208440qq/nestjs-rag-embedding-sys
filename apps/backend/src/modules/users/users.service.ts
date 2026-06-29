import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { CreateUserDto, UpdateUserDto } from '@repo/shared-backend';
import type { UserInfo } from '@repo/shared-types';
import { UsersRepository } from '@/modules/users/users.repository';
import { toUserInfo, toUserRecord } from '@/modules/users/users.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<UserInfo> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} was not found`);
    }
    return toUserInfo(user);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    deptId?: string;
  }) {
    const [users, total] = await this.usersRepository.findAll(params);
    return {
      items: users.map(toUserRecord),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async create(input: CreateUserDto) {
    const existing = await this.usersRepository.findByUsername(input.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }
    const user = await this.usersRepository.create(input);
    return toUserRecord(user);
  }

  async update(id: string, input: UpdateUserDto) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User ${id} was not found`);
    }
    const user = await this.usersRepository.update(id, input);
    return toUserRecord(user);
  }

  async remove(id: string) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User ${id} was not found`);
    }
    return this.usersRepository.remove(id);
  }
}
