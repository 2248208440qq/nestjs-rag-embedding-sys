import { Body, Controller, Post, Res } from '@nestjs/common';
import type { UserInfo } from '@repo/shared-types';
import type { Response } from 'express';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AgentChatDto } from '@/modules/agent/chat/dto/agent-chat.dto';
import { AgentChatService } from '@/modules/agent/chat/chat.service';

type SseResponse = Response & {
  flush?: () => void;
};

@Controller('agent/chat')
export class AgentChatController {
  constructor(private readonly chatService: AgentChatService) {}

  @Post()
  chat(@CurrentUser() user: UserInfo, @Body() dto: AgentChatDto) {
    return this.chatService.chat(user.id, dto);
  }

  @Post('stream')
  async stream(
    @CurrentUser() user: UserInfo,
    @Body() dto: AgentChatDto,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders?.();

    try {
      for await (const event of this.chatService.stream(user.id, dto)) {
        if (response.writableEnded) break;
        this.writeEvent(response, event.event, event.data);
      }
    } catch (error) {
      this.writeEvent(response, 'error', {
        message: error instanceof Error ? error.message : 'Agent stream failed',
      });
    } finally {
      response.end();
    }
  }

  private writeEvent(response: Response, event: string, data: object) {
    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
    (response as SseResponse).flush?.();
  }
}
