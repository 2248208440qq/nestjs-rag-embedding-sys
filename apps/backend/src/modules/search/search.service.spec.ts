import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { PrismaService } from '@/prisma/prisma.service';
import { EmbeddingClientService } from '@/modules/embeddings/embedding-client.service';
import { SearchService } from '@/modules/search/search.service';

describe('SearchService', () => {
  it('merges vector and keyword candidates into hybrid article results', async () => {
    const queryRaw = jest
      .fn()
      .mockImplementation((strings: TemplateStringsArray) => {
        const sql = strings.join('');

        if (sql.includes('ORDER BY c.embedding')) {
          return Promise.resolve([
            createRow({
              chunk_id: 'vector-chunk',
              score: 0.91,
              article_no: '第一条',
            }),
          ]);
        }

        return Promise.resolve([
          createRow({
            chunk_id: 'keyword-chunk',
            content: '第一条 关键词命中的同一条文片段。',
            score: 0.8,
            article_no: '第一条',
          }),
          createRow({
            chunk_id: 'keyword-only',
            document_id: '22222222-2222-2222-2222-222222222222',
            score: 0.7,
            article_no: '第二条',
          }),
        ]);
      });

    const service = new SearchService(
      { $queryRaw: queryRaw } as unknown as PrismaService,
      {
        embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
      } as unknown as EmbeddingClientService,
    );

    const response = await service.search({
      query: '合同责任',
      topK: 10,
      documentIds: ['11111111-1111-1111-1111-111111111111'],
      sourceTypes: ['law'],
    });

    expect(response.query).toBe('合同责任');
    expect(response.results).toHaveLength(2);
    expect(response.results[0]).toMatchObject({
      articleNo: '第一条',
      matchType: 'hybrid',
      scores: {
        vector: 0.91,
        keyword: 0.8,
        rrf: expect.any(Number),
      },
    });
    expect(response.results[0]?.score).toBeGreaterThan(0);
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });

  it('rejects blank queries', async () => {
    const service = new SearchService(
      { $queryRaw: jest.fn() } as unknown as PrismaService,
      { embed: jest.fn() } as unknown as EmbeddingClientService,
    );

    await expect(service.search({ query: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

function createRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    chunk_id: 'chunk-id',
    document_id: '11111111-1111-1111-1111-111111111111',
    title: '中华人民共和国合同法',
    content: '第一条 合同责任。',
    score: 0.9,
    section_path: '第一章 合同',
    article_no: '第一条',
    metadata: {},
    ...overrides,
  };
}
