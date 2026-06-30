import { Module } from '@nestjs/common';

import { CitationValidatorTool } from '@/modules/agent/tools/builtin/citation-validator.tool';
import { LegalSearchTool } from '@/modules/agent/tools/builtin/legal-search.tool';
import { ToolExecutorService } from '@/modules/agent/tools/tool-executor.service';
import { ToolRegistryService } from '@/modules/agent/tools/tool-registry.service';
import { SearchModule } from '@/modules/search/search.module';

@Module({
  exports: [ToolExecutorService, ToolRegistryService],
  imports: [SearchModule],
  providers: [
    CitationValidatorTool,
    LegalSearchTool,
    ToolExecutorService,
    ToolRegistryService,
  ],
})
export class AgentToolsModule {}
