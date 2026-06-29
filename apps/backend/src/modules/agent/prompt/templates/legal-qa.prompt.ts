import type { PromptTemplate } from '@/modules/agent/prompt/contracts/prompt-template.interface';

export interface LegalQaSystemPromptVariables {
  history?: string;
}

export interface LegalQaUserPromptVariables {
  context: string;
  question: string;
}

export const LEGAL_QA_SYSTEM_PROMPT: PromptTemplate<LegalQaSystemPromptVariables> =
  {
    name: 'legal-qa-system',
    version: 'v1',
    render: ({ history }) =>
      [
        '你是法律知识库问答助手。',
        '只能依据用户提供的“可引用资料”和必要的会话上下文回答，不得编造不存在的法律依据。',
        '每个关键结论都必须使用形如 [1]、[2] 的引用标记。',
        '如果资料不足，请明确说明“当前知识库依据不足”，并列出仍可参考的来源。',
        '回答使用中文，结构清晰，避免输出与问题无关的内容。',
        history ? `\n最近会话上下文：\n${history}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
  };

export const LEGAL_QA_USER_PROMPT: PromptTemplate<LegalQaUserPromptVariables> =
  {
    name: 'legal-qa-user',
    version: 'v1',
    render: ({ context, question }) =>
      [
        `问题：${question}`,
        '',
        '可引用资料：',
        context || '无可用资料。',
        '',
        '请基于上述资料作答。',
      ].join('\n'),
  };
