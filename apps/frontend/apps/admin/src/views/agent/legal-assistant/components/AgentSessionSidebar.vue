<script lang="ts" setup>
import type { AgentSession } from '#/api/rag';

import { computed } from 'vue';

import { VbenButton } from '@vben/common-ui';

interface Props {
  activeSessionId?: string;
  sessions: AgentSession[];
}

interface Emits {
  newChat: [];
  removeSession: [sessionId: string];
  selectSession: [sessionId: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const sessionItems = computed(() => {
  return props.sessions.map((session) => ({
    ...session,
    lastActiveText: formatRelativeTime(session.updatedAt),
  }));
});

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diffMs = Math.max(Date.now() - timestamp, 0);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) return '刚刚';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}分`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}时`;
  if (diffMs < week) return `${Math.floor(diffMs / day)}天`;
  return `${Math.floor(diffMs / week)}周`;
}
</script>

<template>
  <aside class="agent-sidebar">
    <div class="sidebar-head">
      <h2>会话</h2>
      <VbenButton class="new-chat-button" size="sm" @click="emit('newChat')">新建</VbenButton>
    </div>

    <div class="session-list">
      <button
        v-for="session in sessionItems"
        :key="session.id"
        :class="['session-item', session.id === props.activeSessionId && 'session-item-active']"
        type="button"
        @click="emit('selectSession', session.id)"
      >
        <span class="session-title">{{ session.title || '未命名会话' }}</span>
        <span class="session-time">{{ session.lastActiveText }}</span>
      </button>
    </div>

    <div class="sidebar-foot">
      <VbenButton
        :disabled="!props.activeSessionId"
        size="sm"
        variant="outline"
        @click="props.activeSessionId && emit('removeSession', props.activeSessionId)"
      >
        归档当前会话
      </VbenButton>
    </div>
  </aside>
</template>

<style scoped>
.agent-sidebar {
  display: flex;
  min-height: 0;
  overflow: clip;
  flex-direction: column;
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

.sidebar-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--agent-border) 68%, transparent);
  padding: 0 4px 6px;
}

.sidebar-head h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(14px, 1.2vw, 18px);
  font-weight: 620;
  line-height: 1.15;
  letter-spacing: 0;
}

.new-chat-button {
  flex-shrink: 0;
}

.sidebar-head :deep(button) {
  min-height: 24px;
  padding: 4px 9px;
  font-size: 10px;
  line-height: 1;
}

.session-list {
  margin: 12px -4px 0;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: 0 4px;
}

.session-item {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: transparent;
  padding: 9px 10px;
  text-align: left;
  transition:
    background 520ms cubic-bezier(0.32, 0.72, 0, 1),
    box-shadow 520ms cubic-bezier(0.32, 0.72, 0, 1),
    color 520ms cubic-bezier(0.32, 0.72, 0, 1);
}

.session-item:hover {
  background: color-mix(in srgb, var(--agent-accent) 64%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--agent-primary) 16%, transparent);
}

.session-item-active {
  background: color-mix(in srgb, var(--agent-primary) 14%, var(--agent-accent));
  color: var(--agent-text);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--agent-primary) 36%, transparent);
}

.session-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 610;
}

.session-time {
  color: var(--agent-muted);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
}

.sidebar-foot {
  flex-shrink: 0;
  padding-top: 12px;
}
</style>
