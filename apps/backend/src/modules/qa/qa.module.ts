import { Module } from '@nestjs/common';

import { AgentChatModule } from '@/modules/agent/chat/chat.module';
import { QaController } from '@/modules/qa/qa.controller';
import { QaService } from '@/modules/qa/qa.service';

@Module({
  imports: [AgentChatModule],
  controllers: [QaController],
  providers: [QaService],
})
export class QaModule {}
