import { LegalChunkingService } from './legal-chunking.service';

describe('LegalChunkingService', () => {
  it('splits oversized legal articles while preserving article metadata', () => {
    const service = new LegalChunkingService();
    const longParagraph = '合同解除责任。'.repeat(180);
    const text = [
      '第一编 总则',
      '第一章 合同',
      `第一条 ${longParagraph}`,
      '第二条 当事人应当遵循诚信原则。',
    ].join('\n\n');

    const chunks = service.chunk(text);
    const firstArticleChunks = chunks.filter(
      (chunk) => chunk.articleNo === '第一条',
    );

    expect(firstArticleChunks.length).toBeGreaterThan(1);
    expect(firstArticleChunks[0]?.sectionPath).toBe('第一编 总则 / 第一章 合同');
    expect(firstArticleChunks[0]?.metadata).toMatchObject({
      articleNo: '第一条',
      previousArticleNo: undefined,
      nextArticleNo: '第二条',
      partIndex: 0,
    });
  });

  it('falls back to paragraph chunks when no legal articles are found', () => {
    const service = new LegalChunkingService();
    const chunks = service.chunk('第一段内容。\n\n第二段内容。');

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      chunkIndex: 0,
      metadata: {
        strategy: 'paragraph',
      },
    });
  });
});
