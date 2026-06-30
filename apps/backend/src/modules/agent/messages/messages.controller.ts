import { Controller, Get, Param } from '@nestjs/common';
import type { UserInfo } from '@repo/shared-types';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AgentMessagesService } from '@/modules/agent/messages/messages.service';

@Controller('agent/sessions/:sessionId/messages')
export class AgentMessagesController {
  constructor(private readonly messagesService: AgentMessagesService) {}

  @Get()
  findBySession(
    @CurrentUser() user: UserInfo,
    @Param('sessionId') sessionId: string,
  ) {
    return this.messagesService.findBySession(user.id, sessionId);
  }
}
