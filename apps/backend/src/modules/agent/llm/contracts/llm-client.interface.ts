export interface LlmModelInfo {
  model: string;
  provider: string;
}

export interface LlmInvokeInput {
  systemPrompt: string;
  userPrompt: string;
}

export interface LlmInvokeResult {
  content: string;
  modelInfo: LlmModelInfo;
}

export interface LlmClient {
  enabled: boolean;
  modelInfo: LlmModelInfo;
  invoke(input: LlmInvokeInput): Promise<LlmInvokeResult>;
}
