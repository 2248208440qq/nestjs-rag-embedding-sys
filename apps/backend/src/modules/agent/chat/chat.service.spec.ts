import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { AgentChatService } from '@/modules/agent/chat/chat.service';
import { LegalQaGraph } from '@/modules/agent/chat/graphs/legal-qa.graph';
import { AgentSessionsService } from '@/modules/agent/sessions/sessions.service';

describe('AgentChatService', () => {
  it('creates a session and returns a QA-compatible response from askOnce', async () => {
    const sessionsService = {
      create: jest.fn().mockResolvedValue({
        agentType: 'legal_qa',
        id: 'session-id',
        knowledgeBaseIds: [],
      }),
    } as unknown as AgentSessionsService;
    const legalQaGraph = {
      run: jest.fn().mockResolvedValue({
        answer: 'answer [1]',
        citations: [],
        citationValidation: { passed: true, warnings: [] },
        fallbackUsed: false,
        messageId: 'message-id',
        sessionId: 'session-id',
        sourceChunks: [],
        traceId: 'trace-id',
      }),
    } as unknown as LegalQaGraph;
    const service = new AgentChatService(legalQaGraph, sessionsService);

    const response = await service.askOnce('user-id', {
      question: '合同责任如何认定？',
      topK: 99,
    });

    expect(sessionsService.create).toHaveBeenCalledWith('user-id', {
      agentType: 'legal_qa',
      knowledgeBaseIds: [],
      title: '合同责任如何认定？',
    });
    expect(legalQaGraph.run).toHaveBeenCalledWith(
      expect.objectContaining({
        question: '合同责任如何认定？',
        sessionId: 'session-id',
        topK: 8,
        userId: 'user-id',
      }),
    );
    expect(response).toMatchObject({
      answer: 'answer [1]',
      retrievalTraceId: 'trace-id',
    });
  });

  it('rejects blank messages', async () => {
    const service = new AgentChatService(
      { run: jest.fn() } as unknown as LegalQaGraph,
      {} as unknown as AgentSessionsService,
    );

    await expect(
      service.chat('user-id', { message: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
