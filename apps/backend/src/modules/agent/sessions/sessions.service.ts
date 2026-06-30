import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AgentSession,
  CreateAgentSessionRequest,
  UpdateAgentSessionRequest,
} from '@repo/shared-types';

import { PrismaService } from '@/prisma/prisma.service';
import { toAgentSession } from '@/modules/agent/shared/agent.mapper';

@Injectable()
export class AgentSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    input: CreateAgentSessionRequest,
  ): Promise<AgentSession> {
    const session = await this.prisma.agentSession.create({
      data: {
        agentType: input.agentType ?? 'legal_qa',
        knowledgeBaseIds: input.knowledgeBaseIds ?? [],
        metadata: toJsonObject(input.metadata),
        title: input.title,
        userId,
      },
    });

    return toAgentSession(session);
  }

  async findAll(userId: string): Promise<AgentSession[]> {
    const sessions = await this.prisma.agentSession.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId },
    });

    return sessions.map(toAgentSession);
  }

  async findOneOrThrow(userId: string, id: string): Promise<AgentSession> {
    const session = await this.prisma.agentSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException(`Agent session ${id} was not found`);
    }

    return toAgentSession(session);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateAgentSessionRequest,
  ): Promise<AgentSession> {
    await this.findOneOrThrow(userId, id);

    const session = await this.prisma.agentSession.update({
      data: {
        ...(input.knowledgeBaseIds
          ? { knowledgeBaseIds: input.knowledgeBaseIds }
          : {}),
        ...(input.metadata ? { metadata: toJsonObject(input.metadata) } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
      },
      where: { id },
    });

    return toAgentSession(session);
  }

  async archive(userId: string, id: string): Promise<AgentSession> {
    return this.update(userId, id, { status: 'archived' });
  }

  async touch(id: string) {
    await this.prisma.agentSession.update({
      data: { updatedAt: new Date() },
      where: { id },
    });
  }
}

function toJsonObject(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonObject {
  return (value ?? {}) as Prisma.InputJsonObject;
}
