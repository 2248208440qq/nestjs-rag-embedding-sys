import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { SearchResponse } from '@repo/shared-types';

import type {
  AgentRunContext,
  AgentTool,
} from '@/modules/agent/tools/contracts/agent-tool.interface';
import { SearchService } from '@/modules/search/search.service';

export const LegalSearchInputSchema = z.object({
  knowledgeBaseIds: z.array(z.string()).optional(),
  query: z.string().min(1),
  topK: z.number().int().min(1).max(8),
});

export type LegalSearchInput = z.infer<typeof LegalSearchInputSchema>;

@Injectable()
export class LegalSearchTool
  implements AgentTool<LegalSearchInput, SearchResponse>
{
  readonly description = 'Search indexed legal knowledge base chunks.';
  readonly name = 'legal_search';
  readonly schema = LegalSearchInputSchema;

  constructor(private readonly searchService: SearchService) {}

  async execute(input: LegalSearchInput, context: AgentRunContext) {
    const response = await this.searchService.search({
      knowledgeBaseIds: input.knowledgeBaseIds,
      query: input.query,
      topK: input.topK,
    });

    context.traceToolCall?.({
      input,
      name: this.name,
      resultCount: response.results.length,
    });

    return response;
  }
}
