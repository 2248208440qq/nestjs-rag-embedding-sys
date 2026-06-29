import { describe, expect, it, jest } from '@jest/globals';

import { AgentMessagesService } from '@/modules/agent/messages/messages.service';
import { ShortTermMemoryService } from '@/modules/agent/memory/short-term-memory.service';

describe('ShortTermMemoryService', () => {
  it('reads the latest 10 messages for the current user and session by default', async () => {
    const messagesService = {
      findRecentBySession: jest.fn().mockResolvedValue([]),
    } as unknown as AgentMessagesService;
    const service = new ShortTermMemoryService(messagesService);

    await service.getRecentMessages('user-id', 'session-id');

    expect(messagesService.findRecentBySession).toHaveBeenCalledWith(
      'user-id',
      'session-id',
      10,
    );
  });
});
