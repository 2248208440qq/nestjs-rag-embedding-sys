import { Module } from '@nestjs/common';

import { AgentsModule } from '../agents/agents.module';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
  imports: [AgentsModule],
  controllers: [QaController],
  providers: [QaService],
})
export class QaModule {}
