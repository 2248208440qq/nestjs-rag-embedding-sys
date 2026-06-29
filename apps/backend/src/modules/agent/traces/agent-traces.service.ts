import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

export interface CreateAgentTraceInput {
  agentType: string;
  error?: string;
  input?: Record<string, unknown>;
  latencyMs?: number;
  messageId?: string;
  modelInfo?: Record<string, unknown>;
  output?: Record<string, unknown>;
  promptSnapshot?: Record<string, unknown>;
  sessionId?: string;
  toolCalls?: Record<string, unknown>[];
}

@Injectable()
export class AgentTracesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAgentTraceInput): Promise<string> {
    const trace = await this.prisma.agentTrace.create({
      data: {
        agentType: input.agentType,
        error: input.error,
        input: toJsonObject(input.input),
        latencyMs: input.latencyMs,
        messageId: input.messageId,
        modelInfo: toJsonObject(input.modelInfo),
        output: toJsonObject(input.output),
        promptSnapshot: toJsonObject(input.promptSnapshot),
        sessionId: input.sessionId,
        toolCalls: (input.toolCalls ?? []) as unknown as Prisma.InputJsonValue,
      },
    });

    return trace.id;
  }
}

function toJsonObject(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonObject {
  return (value ?? {}) as Prisma.InputJsonObject;
}
