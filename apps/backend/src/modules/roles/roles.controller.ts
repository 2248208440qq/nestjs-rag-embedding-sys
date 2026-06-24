import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { CreateRoleDto, UpdateRoleDto } from '@repo/shared-backend';
import { Roles as RolesDecorator } from '../../common/decorators/roles.decorator';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('system/role')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('list')
  @RolesDecorator('super', 'admin')
  @ApiOperation({ summary: 'Get role list (paginated)' })
  async getRoleList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('name') search?: string,
    @Query('status') status?: string,
  ) {
    return this.rolesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: pageSize ? parseInt(pageSize, 10) : 20,
      search,
      status,
    });
  }

  @Post()
  @RolesDecorator('super', 'admin')
  @ApiOperation({ summary: 'Create role' })
  async createRole(@Body() input: CreateRoleDto) {
    return this.rolesService.create(input);
  }

  @Patch(':id')
  @RolesDecorator('super', 'admin')
  @ApiOperation({ summary: 'Update role' })
  async updateRole(@Param('id') id: string, @Body() input: UpdateRoleDto) {
    return this.rolesService.update(id, input);
  }

  @Delete(':id')
  @RolesDecorator('super', 'admin')
  @ApiOperation({ summary: 'Delete role' })
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
