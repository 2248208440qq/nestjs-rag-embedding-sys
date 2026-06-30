import { describe, expect, it } from '@jest/globals';

import { CitationValidatorTool } from '@/modules/agent/tools/builtin/citation-validator.tool';

describe('CitationValidatorTool', () => {
  it('returns a warning when retrieved answers do not include citation markers', async () => {
    const tool = new CitationValidatorTool();

    const result = await tool.execute(
      {
        answer: '这里没有引用编号',
        fallbackUsed: false,
        searchResultCount: 1,
      },
      {},
    );

    expect(result.passed).toBe(false);
    expect(result.warnings).toContain(
      '答案未包含引用编号，已返回来源列表供人工复核。',
    );
  });
});
