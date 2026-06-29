import { Module } from '@nestjs/common';

import { AgentMessagesModule } from '@/modules/agent/messages/messages.module';
import { LongTermMemoryService } from '@/modules/agent/memory/long-term-memory.service';
import { ShortTermMemoryService } from '@/modules/agent/memory/short-term-memory.service';

@Module({
  exports: [LongTermMemoryService, ShortTermMemoryService],
  imports: [AgentMessagesModule],
  providers: [LongTermMemoryService, ShortTermMemoryService],
})
export class AgentMemoryModule {}
