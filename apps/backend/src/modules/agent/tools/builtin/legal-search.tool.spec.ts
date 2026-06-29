import { describe, expect, it, jest } from '@jest/globals';

import { LegalSearchTool } from '@/modules/agent/tools/builtin/legal-search.tool';
import { SearchService } from '@/modules/search/search.service';

describe('LegalSearchTool', () => {
  it('passes query, topK, and knowledgeBaseIds to SearchService', async () => {
    const searchService = {
      search: jest.fn().mockResolvedValue({ query: '市场', results: [] }),
    } as unknown as SearchService;
    const tool = new LegalSearchTool(searchService);
    const traceToolCall = jest.fn();

    const response = await tool.execute(
      {
        knowledgeBaseIds: ['kb-id'],
        query: '市场',
        topK: 5,
      },
      { traceToolCall },
    );

    expect(searchService.search).toHaveBeenCalledWith({
      knowledgeBaseIds: ['kb-id'],
      query: '市场',
      topK: 5,
    });
    expect(traceToolCall).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'legal_search',
        resultCount: 0,
      }),
    );
    expect(response.results).toEqual([]);
  });
});
