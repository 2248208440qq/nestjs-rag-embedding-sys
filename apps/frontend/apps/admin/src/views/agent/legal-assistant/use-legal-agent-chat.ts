import type {
  AgentChatResponse,
  AgentMessage,
  AgentMessageSource,
  AgentSession,
  QaCitation,
  SearchResult,
} from '#/api/rag';

import { computed, nextTick, onBeforeUnmount, shallowRef } from 'vue';

import {
  archiveAgentSession,
  fetchAgentMessages,
  fetchAgentSessions,
  streamAgentChat,
} from '#/api/rag';

export interface LegalAgentUiMessage {
  citations?: QaCitation[];
  content: string;
  id: string;
  pending?: boolean;
  role: 'assistant' | 'user';
  sources?: AgentMessageSource[];
  traceId?: string;
}

export function useLegalAgentChat() {
  const sessions = shallowRef<AgentSession[]>([]);
  const activeSessionId = shallowRef<string>();
  const messages = shallowRef<LegalAgentUiMessage[]>([]);
  const input = shallowRef('');
  const loading = shallowRef(false);
  const streamStatus = shallowRef('等待提问');
  const scrollAnchor = shallowRef<HTMLElement>();
  let controller: AbortController | undefined;

  const activeSession = computed(() => {
    return sessions.value.find((item) => item.id === activeSessionId.value);
  });

  const canSend = computed(() => Boolean(input.value.trim()) && !loading.value);

  async function loadSessions() {
    sessions.value = await fetchAgentSessions();
  }

  async function selectSession(sessionId: string) {
    activeSessionId.value = sessionId;
    const rows = await fetchAgentMessages(sessionId);
    messages.value = rows.map(toUiMessage);
    await scrollToBottom();
  }

  function startNewChat() {
    activeSessionId.value = undefined;
    messages.value = [];
    streamStatus.value = '新会话';
  }

  async function removeSession(sessionId: string) {
    await archiveAgentSession(sessionId);
    await loadSessions();
    if (activeSessionId.value === sessionId) {
      startNewChat();
    }
  }

  async function sendMessage() {
    const content = input.value.trim();
    if (!content || loading.value) return;

    controller?.abort();
    controller = new AbortController();
    input.value = '';
    loading.value = true;
    streamStatus.value = '连接法律助手';

    const userMessage: LegalAgentUiMessage = {
      content,
      id: `user-${Date.now()}`,
      role: 'user',
    };
    const assistantMessage: LegalAgentUiMessage = {
      citations: [],
      content: '',
      id: `assistant-${Date.now()}`,
      pending: true,
      role: 'assistant',
      sources: [],
    };
    messages.value = [...messages.value, userMessage, assistantMessage];
    await scrollToBottom();

    try {
      await streamAgentChat(
        {
          message: content,
          sessionId: activeSessionId.value,
          topK: 5,
        },
        {
          onDelta(payload) {
            appendAssistantMessage(assistantMessage.id, payload.content);
          },
          onDone(response) {
            completeAssistantMessage(assistantMessage.id, response);
          },
          onError() {
            streamStatus.value = '回答失败';
            appendAssistantMessage(assistantMessage.id, '本次连接失败，请稍后重试。');
          },
          onSource(payload) {
            updateAssistantSources(
              assistantMessage.id,
              payload.citations,
              payload.sourceChunks,
            );
          },
          onStatus(payload) {
            streamStatus.value = payload.message;
          },
          signal: controller.signal,
        },
      );
    } finally {
      loading.value = false;
      controller = undefined;
      await loadSessions();
    }
  }

  function bindScrollAnchor(element?: HTMLElement) {
    scrollAnchor.value = element;
  }

  async function scrollToBottom() {
    await nextTick();
    scrollAnchor.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }

  function appendAssistantMessage(id: string, content: string) {
    messages.value = messages.value.map((item) =>
      item.id === id ? { ...item, content: `${item.content}${content}` } : item,
    );
    void scrollToBottom();
  }

  function updateAssistantSources(
    id: string,
    citations: QaCitation[],
    sourceChunks: SearchResult[],
  ) {
    messages.value = messages.value.map((item) =>
      item.id === id
        ? { ...item, citations, sources: toMessageSources(sourceChunks) }
        : item,
    );
  }

  function completeAssistantMessage(id: string, response: AgentChatResponse) {
    activeSessionId.value = response.sessionId;
    streamStatus.value = response.fallbackUsed ? '检索草稿' : '已生成';
    messages.value = messages.value.map((item) =>
      item.id === id ? { ...toUiMessage(response.message), pending: false } : item,
    );
    void scrollToBottom();
  }

  onBeforeUnmount(() => {
    controller?.abort();
  });

  return {
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
  };
}

function toUiMessage(message: AgentMessage): LegalAgentUiMessage {
  return {
    citations: message.citations,
    content: message.content,
    id: message.id,
    role: message.role === 'assistant' ? 'assistant' : 'user',
    sources: message.sources,
    traceId: message.traceId,
  };
}

function toMessageSources(sourceChunks: SearchResult[]): AgentMessageSource[] {
  const createdAt = new Date().toISOString();

  return sourceChunks.map((source, index) => ({
    articleNo: source.articleNo,
    chunkId: source.chunkId,
    content: source.content,
    createdAt,
    documentId: source.documentId,
    id: `${source.chunkId}-${index}`,
    index: index + 1,
    matchType: source.matchType,
    metadata: source.metadata,
    score: source.score,
    sectionPath: source.sectionPath,
    title: source.title,
  }));
}
