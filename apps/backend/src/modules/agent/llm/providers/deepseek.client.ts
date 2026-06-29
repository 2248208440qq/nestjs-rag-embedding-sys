import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { AppConfigService } from '@/config/app-config.service';
import type {
  LlmClient,
  LlmInvokeInput,
  LlmInvokeResult,
  LlmModelInfo,
} from '@/modules/agent/llm/contracts/llm-client.interface';

@Injectable()
export class DeepSeekClient implements LlmClient {
  constructor(private readonly config: AppConfigService) {}

  get enabled() {
    return this.config.llmEnabled && Boolean(this.config.llmApiKey);
  }

  get modelInfo(): LlmModelInfo {
    return {
      model: this.config.llmModel,
      provider: this.config.llmProvider,
    };
  }

  async invoke(input: LlmInvokeInput): Promise<LlmInvokeResult> {
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
      new SystemMessage(input.systemPrompt),
      new HumanMessage(input.userPrompt),
    ]);

    return {
      content: this.toText(response.content),
      modelInfo: this.modelInfo,
    };
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
