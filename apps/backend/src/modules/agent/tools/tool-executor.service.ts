import { Injectable } from '@nestjs/common';

import type {
  AgentRunContext,
  AgentTool,
} from '@/modules/agent/tools/contracts/agent-tool.interface';

@Injectable()
export class ToolExecutorService {
  async execute<TInput, TOutput>(
    tool: AgentTool<TInput, TOutput>,
    input: TInput,
    context: AgentRunContext,
  ): Promise<TOutput> {
    const parsedInput = tool.schema.parse(input);
    return tool.execute(parsedInput, context);
  }
}
