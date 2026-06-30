<script lang="ts" setup>
import { onMounted } from 'vue';

import { Page } from '@vben/common-ui';

import AgentComposer from './components/AgentComposer.vue';
import AgentMessageList from './components/AgentMessageList.vue';
import AgentSessionSidebar from './components/AgentSessionSidebar.vue';
import { useLegalAgentChat } from './use-legal-agent-chat';

const {
  activeSession,
  activeSessionId,
  bindScrollAnchor,
  canSend,
  input,
  loadSessions,
  loading,
  messages,
  removeSession,
  selectSession,
  sendMessage,
  sessions,
  startNewChat,
  streamStatus,
} = useLegalAgentChat();

onMounted(async () => {
  await loadSessions();
});
</script>

<template>
  <Page auto-content-height>
    <div class="legal-agent">
      <AgentSessionSidebar
        :active-session-id="activeSessionId"
        :sessions="sessions"
        @new-chat="startNewChat"
        @remove-session="removeSession"
        @select-session="selectSession"
      />

      <main class="agent-main">
        <header class="agent-header">
          <div class="agent-title">
            <h1>{{ activeSession?.title || '法律助手' }}</h1>
          </div>
          <div class="status-pill">
            <span class="status-dot" />
            {{ streamStatus }}
          </div>
        </header>

        <AgentMessageList :messages="messages" @anchor-ready="bindScrollAnchor" />

        <AgentComposer v-model="input" :can-send="canSend" :loading="loading" @send="sendMessage" />
      </main>
    </div>
  </Page>
</template>

<style scoped>
.legal-agent {
  --agent-bg: hsl(var(--background-deep));
  --agent-panel: hsl(var(--card));
  --agent-text: hsl(var(--foreground));
  --agent-muted: hsl(var(--muted-foreground));
  --agent-border: hsl(var(--border));
  --agent-primary: hsl(var(--primary));
  --agent-primary-text: hsl(var(--primary-foreground));
  --agent-accent: hsl(var(--accent));

  display: grid;
  height: calc(100dvh - 132px);
  min-height: 520px;
  overflow: hidden;
  grid-template-columns: minmax(240px, 286px) minmax(0, 1fr);
  gap: 18px;
  color: var(--agent-text);
}

.agent-main {
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border: 1px solid color-mix(in srgb, var(--agent-border) 78%, transparent);
  border-radius: 26px;
  background:
    radial-gradient(
      circle at 18% 0,
      color-mix(in srgb, var(--agent-primary) 13%, transparent),
      transparent 36%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--agent-panel) 96%, var(--agent-accent) 4%),
      color-mix(in srgb, var(--agent-panel) 88%, var(--agent-bg) 12%)
    );
  padding: 14px;
  box-shadow: 0 24px 78px color-mix(in srgb, var(--agent-primary) 9%, transparent);
}

.agent-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--agent-border) 68%, transparent);
  padding: 0 4px 6px;
}

.agent-title {
  flex: 0 1 min(420px, 46%);
  min-width: 0;
}

.agent-header h1 {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(14px, 1.2vw, 18px);
  font-weight: 620;
  line-height: 1.15;
  letter-spacing: 0;
}

.status-pill {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--agent-primary) 10%, var(--agent-accent));
  padding: 5px 9px;
  font-size: 10px;
  line-height: 1;
  color: color-mix(in srgb, var(--agent-primary) 52%, var(--agent-text));
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--agent-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--agent-primary) 15%, transparent);
}

@media (max-width: 900px) {
  .legal-agent {
    height: auto;
    min-height: calc(100dvh - 132px);
    overflow: visible;
    grid-template-columns: 1fr;
  }

  .agent-main {
    min-height: calc(100dvh - 132px);
  }

  .agent-header h1 {
    max-width: 100%;
  }
}
</style>
