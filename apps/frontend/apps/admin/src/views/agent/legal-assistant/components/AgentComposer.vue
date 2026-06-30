<script lang="ts" setup>
import { useTemplateRef, watch } from 'vue';

import { VbenButton } from '@vben/common-ui';

interface Props {
  canSend: boolean;
  loading: boolean;
}

interface Emits {
  send: [];
}

const model = defineModel<string>({ required: true });
const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const composerRef = useTemplateRef<HTMLTextAreaElement>('composer');

watch(model, () => {
  const element = composerRef.value;
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
});

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    emit('send');
  }
}
</script>

<template>
  <footer class="composer-shell">
    <div class="composer-core">
      <textarea
        ref="composer"
        v-model="model"
        class="composer-input"
        placeholder="向法律助手提问，Shift + Enter 换行"
        rows="1"
        @keydown="handleKeydown"
      />
      <div class="composer-actions">
        <span>TopK 5 / SSE 流式回答</span>
        <VbenButton
          :disabled="!props.canSend"
          :loading="props.loading"
          class="send-button"
          @click="emit('send')"
        >
          发送
        </VbenButton>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.composer-shell {
  flex-shrink: 0;
  border-radius: 20px;
  background: color-mix(in srgb, var(--agent-accent) 84%, var(--agent-primary) 16%);
  padding: 3px;
  box-shadow: 0 -10px 30px color-mix(in srgb, var(--agent-panel) 62%, transparent);
}

.composer-core {
  border-radius: 17px;
  background: color-mix(in srgb, var(--agent-panel) 96%, var(--agent-accent) 4%);
  padding: 10px 11px;
}

.composer-input {
  display: block;
  width: 100%;
  resize: none;
  border: 0;
  background: transparent;
  color: var(--agent-text);
  font-size: 13px;
  line-height: 1.55;
  outline: none;
}

.composer-input::placeholder {
  color: hsl(var(--input-placeholder));
}

.composer-actions {
  margin-top: 7px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--agent-muted);
  font-size: 10px;
}

.send-button {
  min-width: 72px;
}

.composer-actions :deep(button) {
  min-height: 26px;
  padding: 5px 12px;
  font-size: 11px;
}
</style>
