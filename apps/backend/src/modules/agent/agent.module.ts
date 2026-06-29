import { Module } from '@nestjs/common';

import { AgentChatModule } from '@/modules/agent/chat/chat.module';
import { AgentLlmModule } from '@/modules/agent/llm/llm.module';
import { AgentMemoryModule } from '@/modules/agent/memory/memory.module';
import { AgentMessagesModule } from '@/modules/agent/messages/messages.module';
import { AgentPromptModule } from '@/modules/agent/prompt/prompt.module';
import { AgentSessionsModule } from '@/modules/agent/sessions/sessions.module';
import { AgentToolsModule } from '@/modules/agent/tools/tools.module';
import { AgentTracesModule } from '@/modules/agent/traces/traces.module';

@Module({
  exports: [AgentChatModule],
  imports: [
    AgentChatModule,
    AgentLlmModule,
    AgentMemoryModule,
    AgentMessagesModule,
    AgentPromptModule,
    AgentSessionsModule,
    AgentToolsModule,
    AgentTracesModule,
  ],
})
export class AgentModule {}
