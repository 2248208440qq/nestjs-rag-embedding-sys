import { Module } from '@nestjs/common';

import { AgentLlmModule } from '@/modules/agent/llm/llm.module';
import { AgentMemoryModule } from '@/modules/agent/memory/memory.module';
import { AgentMessagesModule } from '@/modules/agent/messages/messages.module';
import { AgentPromptModule } from '@/modules/agent/prompt/prompt.module';
import { AgentSessionsModule } from '@/modules/agent/sessions/sessions.module';
import { AgentToolsModule } from '@/modules/agent/tools/tools.module';
import { AgentTracesModule } from '@/modules/agent/traces/traces.module';
import { AgentChatController } from '@/modules/agent/chat/chat.controller';
import { AgentChatService } from '@/modules/agent/chat/chat.service';
import { LegalQaGraph } from '@/modules/agent/chat/graphs/legal-qa.graph';

@Module({
  controllers: [AgentChatController],
  exports: [AgentChatService],
  imports: [
    AgentLlmModule,
    AgentMemoryModule,
    AgentMessagesModule,
    AgentPromptModule,
    AgentSessionsModule,
    AgentToolsModule,
    AgentTracesModule,
  ],
  providers: [AgentChatService, LegalQaGraph],
})
export class AgentChatModule {}
