import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { DeptStatus } from '@prisma/client';
import { CreateDeptDto, UpdateDeptDto } from '@repo/shared-backend';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeptsService } from './depts.service';

@ApiTags('depts')
@Controller('system/dept')
export class DeptsController {
  constructor(private readonly deptsService: DeptsService) {}

  @Get('list')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Get dept list' })
  async getDeptList() {
    return this.deptsService.findAll();
  }

  @Post()
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Create dept' })
  async createDept(@Body() dto: CreateDeptDto) {
    return this.deptsService.create({
      name: dto.name,
      status: dto.status ? (dto.status as DeptStatus) : undefined,
      remark: dto.remark,
      parentId: dto.parentId,
    });
  }

  @Put(':id')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Update dept' })
  async updateDept(
    @Param('id') id: string,
    @Body() dto: UpdateDeptDto,
  ) {
    return this.deptsService.update(id, {
      name: dto.name,
      status: dto.status ? (dto.status as DeptStatus) : undefined,
      remark: dto.remark,
      parentId: dto.parentId,
    });
  }

  @Delete(':id')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Delete dept' })
  async deleteDept(@Param('id') id: string) {
    return this.deptsService.remove(id);
  }
}
