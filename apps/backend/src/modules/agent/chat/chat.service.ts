import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  AgentChatRequest,
  AgentChatResponse,
  QaResponse,
} from '@repo/shared-types';

import { DEFAULT_QA_TOP_K, MAX_QA_TOP_K } from '@/common/constants';
import {
  LegalQaGraph,
  type LegalQaGraphInput,
  type LegalQaGraphStreamEvent,
} from '@/modules/agent/chat/graphs/legal-qa.graph';
import { AgentSessionsService } from '@/modules/agent/sessions/sessions.service';

@Injectable()
export class AgentChatService {
  constructor(
    private readonly legalQaGraph: LegalQaGraph,
    private readonly sessionsService: AgentSessionsService,
  ) {}

  async chat(
    userId: string,
    request: AgentChatRequest,
  ): Promise<AgentChatResponse> {
    return this.legalQaGraph.run(await this.toGraphInput(userId, request));
  }

  async *stream(
    userId: string,
    request: AgentChatRequest,
  ): AsyncIterable<LegalQaGraphStreamEvent> {
    const input = await this.toGraphInput(userId, request);

    for await (const event of this.legalQaGraph.stream(input)) {
      yield event;
    }
  }

  async askOnce(
    userId: string,
    request: {
      knowledgeBaseIds?: string[];
      question: string;
      topK?: number;
    },
  ): Promise<QaResponse> {
    const response = await this.chat(userId, {
      knowledgeBaseIds: request.knowledgeBaseIds,
      message: request.question,
      topK: request.topK,
    });

    return {
      answer: response.answer,
      citations: response.citations,
      citationValidation: response.citationValidation,
      fallbackUsed: response.fallbackUsed,
      modelInfo: response.modelInfo,
      retrievalTraceId: response.traceId,
      sourceChunks: response.sourceChunks,
    };
  }

  private normalizeTopK(topK: number | undefined) {
    return Math.min(Math.max(topK ?? DEFAULT_QA_TOP_K, 1), MAX_QA_TOP_K);
  }

  private async toGraphInput(
    userId: string,
    request: AgentChatRequest,
  ): Promise<LegalQaGraphInput> {
    const question = request.message.trim();
    if (!question) {
      throw new BadRequestException('message is required');
    }

    const session = request.sessionId
      ? await this.sessionsService.findOneOrThrow(userId, request.sessionId)
      : await this.sessionsService.create(userId, {
          agentType: request.agentType ?? 'legal_qa',
          knowledgeBaseIds: request.knowledgeBaseIds ?? [],
          title: this.toSessionTitle(question),
        });
    const knowledgeBaseIds =
      request.knowledgeBaseIds ?? session.knowledgeBaseIds ?? [];

    return {
      agentType: request.agentType ?? session.agentType,
      knowledgeBaseIds: knowledgeBaseIds.length ? knowledgeBaseIds : undefined,
      question,
      sessionId: session.id,
      topK: this.normalizeTopK(request.topK),
      userId,
    };
  }

  private toSessionTitle(question: string) {
    return question.length > 40 ? `${question.slice(0, 40)}...` : question;
  }
}
