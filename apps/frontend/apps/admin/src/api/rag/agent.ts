import type {
  AgentChatRequest,
  AgentChatResponse,
  AgentMessage,
  AgentSession,
  CreateAgentSessionRequest,
  UpdateAgentSessionRequest,
} from './types';

import { ragDelete, ragGet, ragPatch, ragPost } from './http';

export function chatWithAgent(data: AgentChatRequest) {
  return ragPost<AgentChatResponse>('/agent/chat', data);
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
