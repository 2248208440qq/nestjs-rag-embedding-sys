import { Module } from '@nestjs/common';

import { AppConfigModule } from '@/config/config.module';
import { LlmRegistryService } from '@/modules/agent/llm/llm-registry.service';
import { DeepSeekClient } from '@/modules/agent/llm/providers/deepseek.client';

@Module({
  exports: [LlmRegistryService],
  imports: [AppConfigModule],
  providers: [DeepSeekClient, LlmRegistryService],
})
export class AgentLlmModule {}
