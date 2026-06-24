import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { MenuType, MenuStatus } from '@prisma/client';
import type { UserInfo } from '@repo/shared-types';
import { CreateMenuDto, UpdateMenuDto } from '@repo/shared-backend';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MenusService } from './menus.service';

@ApiTags('menus')
@Controller()
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('menu/all')
  @ApiOperation({ summary: 'Get current user menu tree' })
  async getUserMenus(@CurrentUser() user: UserInfo) {
    return this.menusService.getUserMenus(user);
  }

  @Get('system/menu/list')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Get all menus (admin)' })
  async getAllMenus() {
    return this.menusService.getAllMenus();
  }

  @Get('system/menu/name-exists')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Check if menu name exists' })
  async checkNameExists(@Query('name') name: string) {
    return this.menusService.checkNameExists(name);
  }

  @Get('system/menu/path-exists')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Check if menu path exists' })
  async checkPathExists(@Query('path') path: string) {
    return this.menusService.checkPathExists(path);
  }

  @Post('system/menu')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Create menu' })
  async createMenu(@Body() dto: CreateMenuDto) {
    return this.menusService.create({
      name: dto.name,
      path: dto.path,
      component: dto.component,
      icon: dto.icon,
      type: dto.type as MenuType,
      status: dto.status ? (dto.status as MenuStatus) : undefined,
      orderNo: dto.orderNo,
      meta: dto.meta,
      parentId: dto.parentId,
    });
  }

  @Patch('system/menu/:id')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Update menu' })
  async updateMenu(
    @Param('id') id: string,
    @Body() dto: UpdateMenuDto,
  ) {
    return this.menusService.update(id, {
      name: dto.name,
      path: dto.path,
      component: dto.component,
      icon: dto.icon,
      type: dto.type ? (dto.type as MenuType) : undefined,
      status: dto.status ? (dto.status as MenuStatus) : undefined,
      orderNo: dto.orderNo,
      meta: dto.meta,
      parentId: dto.parentId,
    });
  }

  @Delete('system/menu/:id')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Delete menu' })
  async deleteMenu(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
}
