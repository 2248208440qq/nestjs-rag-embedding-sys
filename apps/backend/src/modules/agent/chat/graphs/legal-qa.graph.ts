import { Injectable } from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type {
  AgentChatResponse,
  AgentMessage,
  AgentMessageSource,
  AgentType,
  QaCitation,
  SearchResult,
} from '@repo/shared-types';

import { AgentMessagesService } from '@/modules/agent/messages/messages.service';
import { ShortTermMemoryService } from '@/modules/agent/memory/short-term-memory.service';
import { LlmRegistryService } from '@/modules/agent/llm/llm-registry.service';
import { PromptRegistryService } from '@/modules/agent/prompt/prompt-registry.service';
import { PromptRendererService } from '@/modules/agent/prompt/prompt-renderer.service';
import { AgentSessionsService } from '@/modules/agent/sessions/sessions.service';
import { ToolExecutorService } from '@/modules/agent/tools/tool-executor.service';
import { ToolRegistryService } from '@/modules/agent/tools/tool-registry.service';
import { AgentTracesService } from '@/modules/agent/traces/agent-traces.service';

interface CitationValidation {
  passed: boolean;
  warnings: string[];
}

export interface LegalQaGraphInput {
  agentType: AgentType;
  knowledgeBaseIds?: string[];
  question: string;
  sessionId: string;
  topK: number;
  userId: string;
}

interface LegalQaGraphOutput extends AgentChatResponse {
  citationValidation?: CitationValidation;
}

export type LegalQaGraphStreamEvent =
  | {
      data: { message: string };
      event: 'status';
    }
  | {
      data: { citations: QaCitation[]; sourceChunks: SearchResult[] };
      event: 'source';
    }
  | {
      data: { content: string };
      event: 'delta';
    }
  | {
      data: AgentChatResponse;
      event: 'done';
    };

const LegalQaState = Annotation.Root({
  agentType: Annotation<AgentType>(),
  answer: Annotation<string>(),
  assistantMessage: Annotation<AgentMessage | undefined>(),
  assistantMessageId: Annotation<string | undefined>(),
  citationValidation: Annotation<CitationValidation | undefined>(),
  citations: Annotation<QaCitation[]>(),
  context: Annotation<string>(),
  fallbackUsed: Annotation<boolean>(),
  knowledgeBaseIds: Annotation<string[] | undefined>(),
  messages: Annotation<AgentMessage[]>(),
  modelInfo: Annotation<{ model: string; provider: string } | undefined>(),
  normalizedQuery: Annotation<string>(),
  promptSnapshot: Annotation<
    { systemPrompt?: string; userPrompt?: string } | undefined
  >(),
  question: Annotation<string>(),
  retrievalError: Annotation<string | undefined>(),
  searchResults: Annotation<SearchResult[]>(),
  sessionId: Annotation<string>(),
  toolCalls: Annotation<Record<string, unknown>[]>(),
  topK: Annotation<number>(),
  traceId: Annotation<string | undefined>(),
  userId: Annotation<string>(),
  userMessageId: Annotation<string | undefined>(),
});

@Injectable()
export class LegalQaGraph {
  private readonly graph = new StateGraph(LegalQaState)
    .addNode('normalize', (state) => this.normalize(state))
    .addNode('saveUserMessage', (state) => this.saveUserMessage(state))
    .addNode('loadMemory', (state) => this.loadMemory(state))
    .addNode('legalSearch', (state) => this.legalSearch(state))
    .addNode('buildContext', (state) => this.buildContext(state))
    .addNode('renderPrompt', (state) => this.renderPrompt(state))
    .addNode('generate', (state) => this.generate(state))
    .addNode('validate', (state) => this.validate(state))
    .addNode('saveAssistantMessage', (state) =>
      this.saveAssistantMessage(state),
    )
    .addNode('persistTrace', (state) => this.persistTrace(state))
    .addEdge(START, 'normalize')
    .addEdge('normalize', 'saveUserMessage')
    .addEdge('saveUserMessage', 'loadMemory')
    .addEdge('loadMemory', 'legalSearch')
    .addEdge('legalSearch', 'buildContext')
    .addEdge('buildContext', 'renderPrompt')
    .addEdge('renderPrompt', 'generate')
    .addEdge('generate', 'validate')
    .addEdge('validate', 'saveAssistantMessage')
    .addEdge('saveAssistantMessage', 'persistTrace')
    .addEdge('persistTrace', END)
    .compile();

  constructor(
    private readonly llmRegistry: LlmRegistryService,
    private readonly messagesService: AgentMessagesService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly promptRenderer: PromptRendererService,
    private readonly sessionsService: AgentSessionsService,
    private readonly shortTermMemory: ShortTermMemoryService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly tracesService: AgentTracesService,
  ) {}

  async run(input: LegalQaGraphInput): Promise<LegalQaGraphOutput> {
    const state = await this.graph.invoke({
      agentType: input.agentType,
      citations: [],
      fallbackUsed: false,
      knowledgeBaseIds: input.knowledgeBaseIds,
      messages: [],
      question: input.question,
      searchResults: [],
      sessionId: input.sessionId,
      toolCalls: [],
      topK: input.topK,
      userId: input.userId,
    });

    return this.toResponse(state);
  }

  async *stream(
    input: LegalQaGraphInput,
  ): AsyncIterable<LegalQaGraphStreamEvent> {
    const state = {
      agentType: input.agentType,
      citations: [],
      fallbackUsed: false,
      knowledgeBaseIds: input.knowledgeBaseIds,
      messages: [],
      question: input.question,
      searchResults: [],
      sessionId: input.sessionId,
      toolCalls: [],
      topK: input.topK,
      userId: input.userId,
    } as unknown as typeof LegalQaState.State;

    yield { data: { message: '规范化问题' }, event: 'status' };
    Object.assign(state, this.normalize(state));

    yield { data: { message: '保存用户消息' }, event: 'status' };
    Object.assign(state, await this.saveUserMessage(state));

    yield { data: { message: '读取短期记忆' }, event: 'status' };
    Object.assign(state, await this.loadMemory(state));

    yield { data: { message: '检索法律知识库' }, event: 'status' };
    Object.assign(state, await this.legalSearch(state));
    yield {
      data: {
        citations: state.citations,
        sourceChunks: state.searchResults,
      },
      event: 'source',
    };

    yield { data: { message: '组织可引用资料' }, event: 'status' };
    Object.assign(state, this.buildContext(state));
    Object.assign(state, this.renderPrompt(state));

    yield { data: { message: 'DeepSeek 生成中' }, event: 'status' };
    for await (const event of this.generateStreaming(state)) {
      if (event.event === 'delta') {
        yield event;
        continue;
      }

      Object.assign(state, event.data);
    }

    yield { data: { message: '校验引用编号' }, event: 'status' };
    Object.assign(state, await this.validate(state));

    yield { data: { message: '保存回答' }, event: 'status' };
    Object.assign(state, await this.saveAssistantMessage(state));
    Object.assign(state, await this.persistTrace(state));

    yield {
      data: this.toResponse(state),
      event: 'done',
    };
  }

  private normalize(state: typeof LegalQaState.State) {
    return {
      normalizedQuery: state.question.replace(/\s+/g, ' ').trim(),
    };
  }

  private async saveUserMessage(state: typeof LegalQaState.State) {
    const message = await this.messagesService.create({
      content: state.question,
      role: 'user',
      sessionId: state.sessionId,
    });

    return { userMessageId: message.id };
  }

  private async loadMemory(state: typeof LegalQaState.State) {
    const messages = await this.shortTermMemory.getRecentMessages(
      state.userId,
      state.sessionId,
    );

    return { messages };
  }

  private async legalSearch(state: typeof LegalQaState.State) {
    const toolCalls = [...state.toolCalls];
    const traceToolCall = (toolCall: Record<string, unknown>) => {
      toolCalls.push(toolCall);
    };

    try {
      const response = await this.toolExecutor.execute(
        this.toolRegistry.getLegalSearch(),
        {
          knowledgeBaseIds: state.knowledgeBaseIds,
          query: state.normalizedQuery || state.question,
          topK: state.topK,
        },
        { traceToolCall },
      );

      return {
        citations: this.toCitations(response.results),
        retrievalError: undefined,
        searchResults: response.results,
        toolCalls,
      };
    } catch {
      return {
        citations: [],
        retrievalError: '检索服务暂不可用，本次回答已降级为 fallback。',
        searchResults: [],
        toolCalls,
      };
    }
  }

  private buildContext(state: typeof LegalQaState.State) {
    const context = state.searchResults
      .map((result, index) => {
        const article = result.articleNo ? ` ${result.articleNo}` : '';
        const section = result.sectionPath ? `（${result.sectionPath}）` : '';

        return [
          `[${index + 1}] ${result.title}${article}${section}`,
          result.content.replace(/\s+/g, ' ').slice(0, 1200),
        ].join('\n');
      })
      .join('\n\n');

    return { context };
  }

  private renderPrompt(state: typeof LegalQaState.State) {
    const history = this.formatHistory(state.messages);
    const systemPrompt = this.promptRenderer.render(
      this.promptRegistry.getLegalQaSystemPrompt(),
      { history },
    );
    const userPrompt = this.promptRenderer.render(
      this.promptRegistry.getLegalQaUserPrompt(),
      {
        context: state.context,
        question: state.question,
      },
    );

    return {
      promptSnapshot: {
        systemPrompt,
        userPrompt,
      },
    };
  }

  private async generate(state: typeof LegalQaState.State) {
    if (state.searchResults.length === 0) {
      return {
        answer: state.retrievalError
          ? `当前检索服务暂不可用，无法获取与“${state.question}”相关的法规依据。`
          : `未检索到与“${state.question}”直接相关的法规依据。`,
        fallbackUsed: true,
      };
    }

    const llm = this.llmRegistry.getDefault();

    try {
      const result = await llm.invoke({
        systemPrompt: state.promptSnapshot?.systemPrompt ?? '',
        userPrompt: state.promptSnapshot?.userPrompt ?? '',
      });

      if (result.content.trim()) {
        return {
          answer: result.content,
          fallbackUsed: false,
          modelInfo: result.modelInfo,
        };
      }
    } catch {
      // Provider details and API keys must never leak to public responses.
    }

    return {
      answer: this.composeFallbackAnswer(state.question, state.searchResults),
      fallbackUsed: true,
      modelInfo: llm.enabled ? llm.modelInfo : undefined,
    };
  }

  private async *generateStreaming(state: typeof LegalQaState.State) {
    if (state.searchResults.length === 0) {
      const answer = state.retrievalError
        ? `当前检索服务暂不可用，无法获取与“${state.question}”相关的法规依据。`
        : `未检索到与“${state.question}”直接相关的法规依据。`;

      yield {
        data: {
          answer,
          fallbackUsed: true,
        },
        event: 'state' as const,
      };
      yield { data: { content: answer }, event: 'delta' as const };
      return;
    }

    const llm = this.llmRegistry.getDefault();

    try {
      let answer = '';
      let modelInfo = llm.modelInfo;

      for await (const chunk of llm.stream({
        systemPrompt: state.promptSnapshot?.systemPrompt ?? '',
        userPrompt: state.promptSnapshot?.userPrompt ?? '',
      })) {
        answer += chunk.content;
        modelInfo = chunk.modelInfo;
        yield { data: { content: chunk.content }, event: 'delta' as const };
      }

      if (answer.trim()) {
        yield {
          data: {
            answer,
            fallbackUsed: false,
            modelInfo,
          },
          event: 'state' as const,
        };
        return;
      }
    } catch {
      // Provider details and API keys must never leak to public responses.
    }

    const answer = this.composeFallbackAnswer(
      state.question,
      state.searchResults,
    );
    yield {
      data: {
        answer,
        fallbackUsed: true,
        modelInfo: llm.enabled ? llm.modelInfo : undefined,
      },
      event: 'state' as const,
    };
    yield { data: { content: answer }, event: 'delta' as const };
  }

  private async validate(state: typeof LegalQaState.State) {
    const toolCalls = [...state.toolCalls];
    const traceToolCall = (toolCall: Record<string, unknown>) => {
      toolCalls.push(toolCall);
    };
    const citationValidation = await this.toolExecutor.execute(
      this.toolRegistry.getCitationValidator(),
      {
        answer: state.answer,
        fallbackUsed: state.fallbackUsed,
        retrievalError: state.retrievalError,
        searchResultCount: state.searchResults.length,
      },
      { traceToolCall },
    );

    return {
      citationValidation,
      toolCalls,
    };
  }

  private async saveAssistantMessage(state: typeof LegalQaState.State) {
    const message = await this.messagesService.create({
      citations: state.citations,
      content: state.answer,
      metadata: {
        citationValidation: state.citationValidation,
        fallbackUsed: state.fallbackUsed,
        modelInfo: state.modelInfo,
      },
      role: 'assistant',
      sessionId: state.sessionId,
      sources: state.searchResults,
      toolCalls: state.toolCalls,
    });

    await this.sessionsService.touch(state.sessionId);

    return {
      assistantMessage: message,
      assistantMessageId: message.id,
    };
  }

  private async persistTrace(state: typeof LegalQaState.State) {
    const startedAt = Date.now();
    const traceId = await this.tracesService.create({
      agentType: state.agentType,
      input: {
        knowledgeBaseIds: state.knowledgeBaseIds ?? [],
        question: state.question,
        topK: state.topK,
        userMessageId: state.userMessageId,
      },
      latencyMs: Date.now() - startedAt,
      messageId: state.assistantMessageId,
      modelInfo: state.modelInfo,
      output: {
        citations: state.citations,
        fallbackUsed: state.fallbackUsed,
        searchResultCount: state.searchResults.length,
      },
      promptSnapshot: state.promptSnapshot,
      sessionId: state.sessionId,
      toolCalls: state.toolCalls,
    });

    const assistantMessage = state.assistantMessageId
      ? await this.messagesService.findById(state.assistantMessageId)
      : state.assistantMessage;

    return { assistantMessage, traceId };
  }

  private toCitations(results: SearchResult[]): QaCitation[] {
    return results.map((result) => ({
      articleNo: result.articleNo,
      chunkId: result.chunkId,
      documentId: result.documentId,
      sectionPath: result.sectionPath,
      title: result.title,
    }));
  }

  private formatHistory(messages: AgentMessage[]) {
    return messages
      .filter(
        (message) => message.role === 'assistant' || message.role === 'user',
      )
      .map((message) => `${message.role}: ${message.content}`)
      .join('\n');
  }

  private composeFallbackAnswer(question: string, results: SearchResult[]) {
    const lines = results.slice(0, 3).map((result, index) => {
      const article = result.articleNo ? ` ${result.articleNo}` : '';
      const content = result.content.replace(/\s+/g, ' ').slice(0, 220);

      return `${index + 1}. ${result.title}${article}：${content} [${index + 1}]`;
    });

    return [
      `基于当前知识库检索结果，问题“${question}”可先参考以下依据：`,
      ...lines,
      '该答案为检索式草稿，正式结论应结合完整法规上下文和引用来源复核。',
    ].join('\n');
  }

  private toResponse(state: typeof LegalQaState.State): LegalQaGraphOutput {
    const message = state.assistantMessage;
    const sourceChunks = message
      ? message.sources.map(toSearchResult)
      : state.searchResults;

    return {
      answer: message?.content ?? state.answer,
      citations: message?.citations ?? state.citations,
      citationValidation:
        message?.citationValidation ?? state.citationValidation,
      fallbackUsed: message?.fallbackUsed ?? state.fallbackUsed,
      message: message!,
      messageId: message?.id ?? state.assistantMessageId!,
      modelInfo: message?.modelInfo ?? state.modelInfo,
      sessionId: state.sessionId,
      sourceChunks,
      traceId: message?.traceId ?? state.traceId,
    };
  }
}

function toSearchResult(source: AgentMessageSource): SearchResult {
  return {
    articleNo: source.articleNo,
    chunkId: source.chunkId,
    content: source.content,
    documentId: source.documentId,
    matchType: source.matchType,
    metadata: source.metadata,
    score: source.score,
    sectionPath: source.sectionPath,
    title: source.title,
  };
}
