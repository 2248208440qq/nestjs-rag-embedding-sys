import { Injectable } from '@nestjs/common';
import type { AgentMessage } from '@repo/shared-types';

import { AgentMessagesService } from '@/modules/agent/messages/messages.service';

const DEFAULT_SHORT_TERM_MESSAGE_LIMIT = 10;

@Injectable()
export class ShortTermMemoryService {
  constructor(private readonly messagesService: AgentMessagesService) {}

  getRecentMessages(
    userId: string,
    sessionId: string,
    limit = DEFAULT_SHORT_TERM_MESSAGE_LIMIT,
  ): Promise<AgentMessage[]> {
    return this.messagesService.findRecentBySession(userId, sessionId, limit);
  }
}
