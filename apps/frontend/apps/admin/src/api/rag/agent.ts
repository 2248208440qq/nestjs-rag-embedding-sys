import type {
  AgentChatRequest,
  AgentChatResponse,
  AgentMessage,
  AgentSession,
  CreateAgentSessionRequest,
  QaCitation,
  SearchResult,
  UpdateAgentSessionRequest,
} from './types';
import type { EventSourceMessage } from '@microsoft/fetch-event-source';

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAppConfig } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import { ragDelete, ragGet, ragPatch, ragPost } from './http';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

export interface AgentChatStreamHandlers {
  onDelta?: (payload: { content: string }) => void;
  onDone?: (payload: AgentChatResponse) => void;
  onError?: (error: unknown) => void;
  onSource?: (payload: { citations: QaCitation[]; sourceChunks: SearchResult[] }) => void;
  onStatus?: (payload: { message: string }) => void;
  signal?: AbortSignal;
}

export function chatWithAgent(data: AgentChatRequest) {
  return ragPost<AgentChatResponse>('/agent/chat', data);
}

export function streamAgentChat(data: AgentChatRequest, handlers: AgentChatStreamHandlers) {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  return fetchEventSource(`${apiURL}/agent/chat/stream`, {
    body: JSON.stringify(data),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    method: 'POST',
    onerror(error) {
      handlers.onError?.(error);
      throw error;
    },
    onmessage(message) {
      handleStreamMessage(message, handlers);
    },
    openWhenHidden: true,
    signal: handlers.signal,
  });
}

export function createAgentSession(data: CreateAgentSessionRequest = {}) {
  return ragPost<AgentSession>('/agent/sessions', data);
}

export function fetchAgentSessions() {
  return ragGet<AgentSession[]>('/agent/sessions');
}

export function fetchAgentSession(id: string) {
  return ragGet<AgentSession>(`/agent/sessions/${id}`);
}

export function updateAgentSession(id: string, data: UpdateAgentSessionRequest) {
  return ragPatch<AgentSession>(`/agent/sessions/${id}`, data);
}

export function archiveAgentSession(id: string) {
  return ragDelete<AgentSession>(`/agent/sessions/${id}`);
}

export function fetchAgentMessages(sessionId: string) {
  return ragGet<AgentMessage[]>(`/agent/sessions/${sessionId}/messages`);
}

function handleStreamMessage(message: EventSourceMessage, handlers: AgentChatStreamHandlers) {
  const payload = message.data ? JSON.parse(message.data) : {};

  if (message.event === 'status') {
    handlers.onStatus?.(payload);
    return;
  }

  if (message.event === 'delta') {
    handlers.onDelta?.(payload);
    return;
  }

  if (message.event === 'source') {
    handlers.onSource?.(payload);
    return;
  }

  if (message.event === 'done') {
    handlers.onDone?.(payload);
    return;
  }

  if (message.event === 'error') {
    handlers.onError?.(payload);
  }
}
