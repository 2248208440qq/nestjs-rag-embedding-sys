import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { UserInfo } from '@repo/shared-types';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  CreateAgentSessionDto,
  UpdateAgentSessionDto,
} from '@/modules/agent/sessions/dto/agent-session.dto';
import { AgentSessionsService } from '@/modules/agent/sessions/sessions.service';

@Controller('agent/sessions')
export class AgentSessionsController {
  constructor(private readonly sessionsService: AgentSessionsService) {}

  @Post()
  create(@CurrentUser() user: UserInfo, @Body() dto: CreateAgentSessionDto) {
    return this.sessionsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserInfo) {
    return this.sessionsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserInfo, @Param('id') id: string) {
    return this.sessionsService.findOneOrThrow(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserInfo,
    @Param('id') id: string,
    @Body() dto: UpdateAgentSessionDto,
  ) {
    return this.sessionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  archive(@CurrentUser() user: UserInfo, @Param('id') id: string) {
    return this.sessionsService.archive(user.id, id);
  }
}
