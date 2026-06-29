import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { AgentSessionsController } from '@/modules/agent/sessions/sessions.controller';
import { AgentSessionsService } from '@/modules/agent/sessions/sessions.service';

@Module({
  controllers: [AgentSessionsController],
  exports: [AgentSessionsService],
  imports: [PrismaModule],
  providers: [AgentSessionsService],
})
export class AgentSessionsModule {}
