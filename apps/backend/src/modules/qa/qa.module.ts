import { Module } from '@nestjs/common';

import { AgentsModule } from '@/modules/agents/agents.module';
import { QaController } from '@/modules/qa/qa.controller';
import { QaService } from '@/modules/qa/qa.service';

@Module({
  imports: [AgentsModule],
  controllers: [QaController],
  providers: [QaService],
})
export class QaModule {}
