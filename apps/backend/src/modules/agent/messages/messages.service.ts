import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AgentMessage,
  AgentMessageRole,
  AgentMessageStatus,
  QaCitation,
} from '@repo/shared-types';

import { PrismaService } from '@/prisma/prisma.service';
import { toAgentMessage } from '@/modules/agent/shared/agent.mapper';

export interface CreateAgentMessageInput {
  citations?: QaCitation[];
  content: string;
  metadata?: Record<string, unknown>;
  role: AgentMessageRole;
  sessionId: string;
  status?: AgentMessageStatus;
  toolCalls?: Record<string, unknown>[];
}

@Injectable()
export class AgentMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAgentMessageInput): Promise<AgentMessage> {
    const message = await this.prisma.agentMessage.create({
      data: {
        citations: (input.citations ?? []) as unknown as Prisma.InputJsonValue,
        content: input.content,
        metadata: toJsonObject(input.metadata),
        role: input.role,
        sessionId: input.sessionId,
        status: input.status ?? 'completed',
        toolCalls: (input.toolCalls ?? []) as unknown as Prisma.InputJsonValue,
      },
    });

    return toAgentMessage(message);
  }

  async findBySession(
    userId: string,
    sessionId: string,
    limit?: number,
  ): Promise<AgentMessage[]> {
    const messages = await this.prisma.agentMessage.findMany({
      orderBy: { createdAt: 'asc' },
      ...(limit ? { take: limit } : {}),
      where: {
        session: {
          id: sessionId,
          userId,
        },
      },
    });

    return messages.map(toAgentMessage);
  }

  async findRecentBySession(
    userId: string,
    sessionId: string,
    limit: number,
  ): Promise<AgentMessage[]> {
    const messages = await this.prisma.agentMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      where: {
        session: {
          id: sessionId,
          userId,
        },
      },
    });

    return messages.reverse().map(toAgentMessage);
  }
}

function toJsonObject(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonObject {
  return (value ?? {}) as Prisma.InputJsonObject;
}
