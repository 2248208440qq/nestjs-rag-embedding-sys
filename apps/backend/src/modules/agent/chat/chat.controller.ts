import { Body, Controller, Post } from '@nestjs/common';
import type { UserInfo } from '@repo/shared-types';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AgentChatDto } from '@/modules/agent/chat/dto/agent-chat.dto';
import { AgentChatService } from '@/modules/agent/chat/chat.service';

@Controller('agent/chat')
export class AgentChatController {
  constructor(private readonly chatService: AgentChatService) {}

  @Post()
  chat(@CurrentUser() user: UserInfo, @Body() dto: AgentChatDto) {
    return this.chatService.chat(user.id, dto);
  }
}
