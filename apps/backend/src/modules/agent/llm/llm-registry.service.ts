import { Injectable } from '@nestjs/common';

import { DeepSeekClient } from '@/modules/agent/llm/providers/deepseek.client';

@Injectable()
export class LlmRegistryService {
  constructor(private readonly deepSeekClient: DeepSeekClient) {}

  getDefault() {
    return this.deepSeekClient;
  }
}
