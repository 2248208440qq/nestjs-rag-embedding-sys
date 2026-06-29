import { Module } from '@nestjs/common';

import { AppConfigModule } from '@/config/config.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { SearchModule } from '@/modules/search/search.module';
import { DeepSeekLlmService } from '@/modules/agents/deepseek-llm.service';
import { LegalQaGraphService } from '@/modules/agents/legal-qa-graph.service';

@Module({
  exports: [LegalQaGraphService],
  imports: [AppConfigModule, PrismaModule, SearchModule],
  providers: [DeepSeekLlmService, LegalQaGraphService],
})
export class AgentsModule {}
