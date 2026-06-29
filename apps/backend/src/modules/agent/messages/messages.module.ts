import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { AgentMessagesController } from '@/modules/agent/messages/messages.controller';
import { AgentMessagesService } from '@/modules/agent/messages/messages.service';

@Module({
  controllers: [AgentMessagesController],
  exports: [AgentMessagesService],
  imports: [PrismaModule],
  providers: [AgentMessagesService],
})
export class AgentMessagesModule {}
