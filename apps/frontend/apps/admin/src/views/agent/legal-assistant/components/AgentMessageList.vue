<script lang="ts" setup>
import { computed, onMounted, useTemplateRef } from 'vue';

import { renderAgentMarkdown } from '../markdown';
import type { LegalAgentUiMessage } from '../use-legal-agent-chat';

interface Props {
  messages: LegalAgentUiMessage[];
}

interface Emits {
  anchorReady: [element?: HTMLElement];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const scrollAnchorRef = useTemplateRef<HTMLElement>('scrollAnchor');

const renderedMessages = computed(() => {
  return props.messages.map((message) => ({
    ...message,
    html: renderAgentMarkdown(message.content || '正在整理法律依据...'),
  }));
});

const emptyStateVisible = computed(() => props.messages.length === 0);

onMounted(() => {
  emit('anchorReady', scrollAnchorRef.value ?? undefined);
});
</script>

<template>
  <section class="message-stream">
    <div v-if="emptyStateVisible" class="empty-state">
      <div class="empty-orbit">
        <span />
      </div>
      <h2>提出一个法律问题，开始生成可追溯的分析</h2>
      <p>
        支持连续追问、知识库检索、引用来源追踪。回答会按文档阅读区呈现，便于审阅条文和推理过程。
      </p>
    </div>

    <article
      v-for="message in renderedMessages"
      :key="message.id"
      :class="['message-row', message.role === 'user' ? 'message-user' : 'message-assistant']"
    >
      <template v-if="message.role === 'user'">
        <div class="user-bubble">
          <div class="user-text">{{ message.content }}</div>
        </div>
      </template>

      <template v-else>
        <div class="assistant-response">
          <div class="assistant-kicker">
            <span v-if="message.pending">生成中</span>
          </div>
          <div class="markdown-body" v-html="message.html" />
          <div v-if="message.sources?.length" class="source-list" aria-label="引用来源">
            <div
              v-for="source in message.sources"
              :key="source.id"
              class="source-item"
            >
              <span class="source-index">[{{ source.index }}]</span>
              <span class="source-title">{{ source.title }}</span>
              <span v-if="source.articleNo" class="source-meta">{{ source.articleNo }}</span>
              <span v-if="source.sectionPath" class="source-meta">{{ source.sectionPath }}</span>
              <span class="source-score">{{ Math.round(source.score * 100) }}%</span>
            </div>
          </div>
        </div>
      </template>
    </article>

    <div ref="scrollAnchor" />
  </section>
</template>

<style scoped>
.message-stream {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 4px 22px 10px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 420ms cubic-bezier(0.32, 0.72, 0, 1);
}

.message-stream:hover {
  scrollbar-color: color-mix(in srgb, var(--agent-primary) 28%, transparent) transparent;
}

.message-stream::-webkit-scrollbar {
  width: 6px;
}

.message-stream::-webkit-scrollbar-track {
  background: transparent;
}

.message-stream::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: transparent;
}

.message-stream:hover::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--agent-primary) 28%, transparent);
}

.empty-state {
  margin: 8vh auto 0;
  max-width: 720px;
  text-align: center;
}

.empty-orbit {
  margin: 0 auto 24px;
  display: grid;
  width: 82px;
  height: 82px;
  place-items: center;
  border-radius: 999px;
  background:
    radial-gradient(circle, var(--agent-panel) 0 48%, transparent 49%),
    conic-gradient(
      from 120deg,
      color-mix(in srgb, var(--agent-primary) 80%, var(--agent-accent)),
      color-mix(in srgb, var(--agent-primary) 36%, var(--agent-accent)),
      var(--agent-accent),
      color-mix(in srgb, var(--agent-primary) 80%, var(--agent-accent))
    );
}

.empty-orbit span {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--agent-primary);
}

.empty-state h2 {
  margin: 0;
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 720;
  letter-spacing: 0;
}

.empty-state p {
  margin: 16px auto 0;
  max-width: 560px;
  color: var(--agent-muted);
  line-height: 1.8;
}

.message-row {
  margin: 0 auto 16px;
  max-width: min(1180px, 100%);
}

.message-user {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  max-width: min(680px, 86%);
  border-radius: 18px 18px 7px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--agent-primary) 92%, var(--agent-accent)),
    color-mix(in srgb, var(--agent-primary) 72%, var(--agent-accent))
  );
  padding: 11px 14px;
  color: var(--agent-primary-text);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--agent-primary) 14%, transparent);
}

.assistant-kicker {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 760;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.message-label {
  color: color-mix(in srgb, var(--agent-primary-text) 78%, transparent);
}

.user-text {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.65;
}

.message-assistant {
  display: block;
}

.assistant-response {
  width: 100%;
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--agent-panel) 98%, var(--agent-accent) 2%),
    color-mix(in srgb, var(--agent-panel) 90%, var(--agent-accent) 10%)
  );
  padding: clamp(14px, 2vw, 24px);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--agent-primary-text) 18%, transparent),
    0 12px 38px color-mix(in srgb, var(--agent-primary) 6%, transparent);
}

.assistant-kicker {
  color: color-mix(in srgb, var(--agent-primary) 58%, var(--agent-muted));
}

.markdown-body {
  color: var(--agent-text);
  font-size: 13px;
}

.markdown-body :deep(.agent-md-paragraph) {
  margin: 9px 0;
  color: color-mix(in srgb, var(--agent-text) 88%, var(--agent-muted));
  line-height: 1.75;
}

.markdown-body :deep(.agent-md-heading) {
  margin: 20px 0 9px;
  color: var(--agent-text);
  font-weight: 720;
  letter-spacing: 0;
}

.markdown-body :deep(.agent-md-heading-1) {
  font-size: 21px;
}

.markdown-body :deep(.agent-md-heading-2) {
  font-size: 18px;
}

.markdown-body :deep(.agent-md-heading-3) {
  font-size: 15px;
}

.markdown-body :deep(.agent-md-blockquote) {
  margin: 12px 0;
  border-left: 3px solid color-mix(in srgb, var(--agent-primary) 54%, var(--agent-border));
  border-radius: 0 18px 18px 0;
  background: color-mix(in srgb, var(--agent-primary) 8%, var(--agent-accent));
  padding: 10px 12px;
  color: color-mix(in srgb, var(--agent-text) 76%, var(--agent-muted));
}

.markdown-body :deep(.agent-md-link) {
  color: color-mix(in srgb, var(--agent-primary) 82%, var(--agent-text));
  font-weight: 650;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--agent-primary) 42%, transparent);
  text-underline-offset: 4px;
}

.markdown-body :deep(.agent-md-list) {
  margin: 9px 0;
  list-style: disc;
  padding-left: 24px;
}

.markdown-body :deep(.agent-md-list-ordered) {
  list-style: decimal;
}

.markdown-body :deep(.agent-md-list li) {
  margin: 6px 0;
  line-height: 1.7;
}

.markdown-body :deep(.agent-md-codespan) {
  border-radius: 7px;
  background: color-mix(in srgb, var(--agent-primary) 10%, var(--agent-accent));
  padding: 2px 6px;
  color: color-mix(in srgb, var(--agent-primary) 78%, var(--agent-text));
  font-size: 0.92em;
}

.markdown-body :deep(.agent-md-code) {
  margin: 12px 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--agent-primary) 20%, var(--agent-border));
  border-radius: 14px;
  background: color-mix(in srgb, var(--agent-accent) 78%, var(--agent-panel));
}

.markdown-body :deep(.agent-md-code-title) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid color-mix(in srgb, var(--agent-border) 78%, transparent);
  padding: 7px 12px;
  color: var(--agent-muted);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.markdown-body :deep(.agent-md-pre) {
  overflow-x: auto;
  padding: 12px;
  color: var(--agent-text);
  font-size: 12px;
  line-height: 1.65;
}

.markdown-body :deep(.agent-md-table-wrap) {
  margin: 12px 0;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--agent-border) 80%, transparent);
  border-radius: 14px;
}

.markdown-body :deep(.agent-md-table) {
  min-width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.markdown-body :deep(.agent-md-table thead) {
  background: color-mix(in srgb, var(--agent-primary) 8%, var(--agent-accent));
  color: color-mix(in srgb, var(--agent-primary) 62%, var(--agent-text));
}

.markdown-body :deep(.agent-md-th),
.markdown-body :deep(.agent-md-td) {
  padding: 12px 14px;
  text-align: left;
}

.markdown-body :deep(.agent-md-td) {
  border-top: 1px solid color-mix(in srgb, var(--agent-border) 74%, transparent);
}

.source-list {
  margin-top: 14px;
  display: grid;
  gap: 6px;
  border-top: 1px solid color-mix(in srgb, var(--agent-border) 70%, transparent);
  padding-top: 10px;
}

.source-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto auto;
  gap: 7px;
  align-items: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--agent-primary) 5%, transparent);
  padding: 7px 9px;
  color: color-mix(in srgb, var(--agent-text) 78%, var(--agent-muted));
  font-size: 11px;
  line-height: 1.3;
}

.source-index {
  color: color-mix(in srgb, var(--agent-primary) 78%, var(--agent-text));
  font-weight: 680;
}

.source-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-meta,
.source-score {
  color: var(--agent-muted);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .message-stream {
    padding-inline: 0 4px;
  }

  .user-bubble {
    max-width: 94%;
  }
}
</style>
