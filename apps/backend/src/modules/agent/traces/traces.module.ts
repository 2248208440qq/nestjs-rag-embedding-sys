import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { AgentTracesService } from '@/modules/agent/traces/agent-traces.service';

@Module({
  exports: [AgentTracesService],
  imports: [PrismaModule],
  providers: [AgentTracesService],
})
export class AgentTracesModule {}
