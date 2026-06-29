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
import type { CreateUserDto, UpdateUserDto } from '@repo/shared-backend';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { UserInfo } from '@repo/shared-types';
import { UsersService } from '@/modules/users/users.service';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('user/info')
  @ApiOperation({ summary: 'Get current user info' })
  async getCurrentUser(@CurrentUser() user: UserInfo): Promise<UserInfo> {
    return this.usersService.findById(user.id);
  }

  @Get('system/user/list')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Get user list (paginated)' })
  async getUserList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('name') search?: string,
    @Query('status') status?: string,
    @Query('deptId') deptId?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: pageSize ? parseInt(pageSize, 10) : 20,
      search,
      status,
      deptId,
    });
  }

  @Post('system/user')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Create user' })
  async createUser(@Body() input: CreateUserDto) {
    return this.usersService.create(input);
  }

  @Patch('system/user/:id')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Param('id') id: string,
    @Body() input: UpdateUserDto,
  ) {
    return this.usersService.update(id, input);
  }

  @Delete('system/user/:id')
  @Roles('super', 'admin')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
