import type { ZodType } from 'zod';

export interface AgentRunContext {
  traceToolCall?: (toolCall: Record<string, unknown>) => void;
}

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  description: string;
  name: string;
  schema: ZodType<TInput>;
  execute(input: TInput, context: AgentRunContext): Promise<TOutput>;
}
