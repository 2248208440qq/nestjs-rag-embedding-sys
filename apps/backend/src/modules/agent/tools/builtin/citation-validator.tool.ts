import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import type {
  AgentRunContext,
  AgentTool,
} from '@/modules/agent/tools/contracts/agent-tool.interface';

const CitationValidatorInputSchema = z.object({
  answer: z.string(),
  fallbackUsed: z.boolean(),
  retrievalError: z.string().optional(),
  searchResultCount: z.number().int().min(0),
});

export type CitationValidatorInput = z.infer<
  typeof CitationValidatorInputSchema
>;

export interface CitationValidationResult {
  passed: boolean;
  warnings: string[];
}

@Injectable()
export class CitationValidatorTool
  implements AgentTool<CitationValidatorInput, CitationValidationResult>
{
  readonly description = 'Validate citation markers in a legal answer.';
  readonly name = 'citation_validator';
  readonly schema = CitationValidatorInputSchema;

  async execute(input: CitationValidatorInput, context: AgentRunContext) {
    const warnings: string[] = [];

    if (input.searchResultCount > 0 && !/\[\d+]/.test(input.answer)) {
      warnings.push('答案未包含引用编号，已返回来源列表供人工复核。');
    }

    if (input.fallbackUsed) {
      warnings.push('本次回答使用了检索式 fallback，未完成 DeepSeek 生成。');
    }

    if (input.retrievalError) {
      warnings.push(input.retrievalError);
    }

    const result = {
      passed: warnings.length === 0,
      warnings,
    };

    context.traceToolCall?.({
      input: {
        fallbackUsed: input.fallbackUsed,
        retrievalError: input.retrievalError,
        searchResultCount: input.searchResultCount,
      },
      name: this.name,
      result,
    });

    return result;
  }
}
