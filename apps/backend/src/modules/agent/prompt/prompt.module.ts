import { Module } from '@nestjs/common';

import { PromptRegistryService } from '@/modules/agent/prompt/prompt-registry.service';
import { PromptRendererService } from '@/modules/agent/prompt/prompt-renderer.service';

@Module({
  exports: [PromptRegistryService, PromptRendererService],
  providers: [PromptRegistryService, PromptRendererService],
})
export class AgentPromptModule {}
