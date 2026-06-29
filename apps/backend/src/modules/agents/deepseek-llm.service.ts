import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class DeepSeekLlmService {
  constructor(private readonly config: AppConfigService) {}

  get enabled() {
    return this.config.llmEnabled && Boolean(this.config.llmApiKey);
  }

  get modelInfo() {
    return {
      model: this.config.llmModel,
      provider: this.config.llmProvider,
    };
  }

  async generateAnswer(input: {
    context: string;
    question: string;
  }): Promise<string> {
    if (!this.enabled) {
      throw new Error('LLM is disabled');
    }

    const model = new ChatOpenAI({
      apiKey: this.config.llmApiKey,
      configuration: {
        baseURL: this.config.llmBaseUrl,
      },
      maxTokens: this.config.llmMaxTokens,
      model: this.config.llmModel,
      temperature: this.config.llmTemperature,
      timeout: this.config.llmTimeoutMs,
    });

    const response = await model.invoke([
      new SystemMessage(this.buildSystemPrompt()),
      new HumanMessage(
        [
          `问题：${input.question}`,
          '',
          '可引用资料：',
          input.context || '无可用资料。',
          '',
          '请基于上述资料作答。',
        ].join('\n'),
      ),
    ]);

    return this.toText(response.content);
  }

  private buildSystemPrompt() {
    return [
      '你是法律知识库问答助手。',
      '只能依据用户提供的“可引用资料”回答，不得编造不存在的法律依据。',
      '每个关键结论都必须使用形如 [1]、[2] 的引用标记。',
      '如果资料不足，请明确说明“当前知识库依据不足”，并列出仍可参考的来源。',
      '回答使用中文，结构清晰，避免输出与问题无关的内容。',
    ].join('\n');
  }

  private toText(content: unknown) {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }

          if (
            part &&
            typeof part === 'object' &&
            'text' in part &&
            typeof part.text === 'string'
          ) {
            return part.text;
          }

          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    return '';
  }
}
