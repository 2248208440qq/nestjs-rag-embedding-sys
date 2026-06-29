import { Injectable } from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { Prisma } from '@prisma/client';
import type { QaCitation, QaResponse, SearchResult } from '@repo/shared-types';

import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { DeepSeekLlmService } from './deepseek-llm.service';

interface LegalQaGraphInput {
  knowledgeBaseIds?: string[];
  question: string;
  topK: number;
}

interface CitationValidation {
  passed: boolean;
  warnings: string[];
}

const LegalQaState = Annotation.Root({
  answer: Annotation<string>(),
  citationValidation: Annotation<CitationValidation>(),
  citations: Annotation<QaCitation[]>(),
  context: Annotation<string>(),
  fallbackUsed: Annotation<boolean>(),
  knowledgeBaseIds: Annotation<string[] | undefined>(),
  normalizedQuery: Annotation<string>(),
  question: Annotation<string>(),
  retrievalError: Annotation<string | undefined>(),
  retrievalTraceId: Annotation<string | undefined>(),
  searchResults: Annotation<SearchResult[]>(),
  topK: Annotation<number>(),
});

@Injectable()
export class LegalQaGraphService {
  private readonly graph = new StateGraph(LegalQaState)
    .addNode('normalizeQuery', (state) => this.normalizeQuery(state))
    .addNode('retrieve', (state) => this.retrieve(state))
    .addNode('buildContext', (state) => this.buildContext(state))
    .addNode('generateAnswer', (state) => this.generateAnswer(state))
    .addNode('validateCitations', (state) => this.validateCitations(state))
    .addNode('persistTrace', (state) => this.persistTrace(state))
    .addEdge(START, 'normalizeQuery')
    .addEdge('normalizeQuery', 'retrieve')
    .addEdge('retrieve', 'buildContext')
    .addEdge('buildContext', 'generateAnswer')
    .addEdge('generateAnswer', 'validateCitations')
    .addEdge('validateCitations', 'persistTrace')
    .addEdge('persistTrace', END)
    .compile();

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly deepSeek: DeepSeekLlmService,
  ) {}

  async run(input: LegalQaGraphInput): Promise<QaResponse> {
    const state = await this.graph.invoke({
      citations: [],
      fallbackUsed: false,
      knowledgeBaseIds: input.knowledgeBaseIds,
      question: input.question,
      retrievalError: undefined,
      searchResults: [],
      topK: input.topK,
    });

    return {
      answer: state.answer,
      citations: state.citations,
      citationValidation: state.citationValidation,
      fallbackUsed: state.fallbackUsed,
      modelInfo: this.deepSeek.enabled ? this.deepSeek.modelInfo : undefined,
      retrievalTraceId: state.retrievalTraceId,
      sourceChunks: state.searchResults,
    };
  }

  private normalizeQuery(state: typeof LegalQaState.State) {
    return {
      normalizedQuery: state.question.replace(/\s+/g, ' ').trim(),
    };
  }

  private async retrieve(state: typeof LegalQaState.State) {
    try {
      const response = await this.searchService.search({
        knowledgeBaseIds: state.knowledgeBaseIds,
        query: state.normalizedQuery || state.question,
        topK: state.topK,
      });

      return {
        citations: this.toCitations(response.results),
        retrievalError: undefined,
        searchResults: response.results,
      };
    } catch {
      return {
        citations: [],
        retrievalError: '检索服务暂不可用，本次回答已降级为 fallback。',
        searchResults: [],
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

  private async generateAnswer(state: typeof LegalQaState.State) {
    if (state.searchResults.length === 0) {
      return {
        answer: state.retrievalError
          ? `当前检索服务暂不可用，无法获取与“${state.question}”相关的法规依据。`
          : `未检索到与“${state.question}”直接相关的法规依据。`,
        fallbackUsed: true,
      };
    }

    try {
      const answer = await this.deepSeek.generateAnswer({
        context: state.context,
        question: state.question,
      });

      if (answer.trim()) {
        return { answer, fallbackUsed: false };
      }
    } catch {
      // Provider details and API keys must never leak to public responses.
    }

    return {
      answer: this.composeFallbackAnswer(state.question, state.searchResults),
      fallbackUsed: true,
    };
  }

  private validateCitations(state: typeof LegalQaState.State) {
    const warnings: string[] = [];

    if (state.searchResults.length > 0 && !/\[\d+]/.test(state.answer)) {
      warnings.push('答案未包含引用编号，已返回来源列表供人工复核。');
    }

    if (state.fallbackUsed) {
      warnings.push('本次回答使用了检索式 fallback，未完成 DeepSeek 生成。');
    }

    if (state.retrievalError) {
      warnings.push(state.retrievalError);
    }

    return {
      citationValidation: {
        passed: warnings.length === 0,
        warnings,
      },
    };
  }

  private async persistTrace(state: typeof LegalQaState.State) {
    const trace = await this.prisma.qaTrace.create({
      data: {
        answer: state.answer,
        citations: state.citations as unknown as Prisma.InputJsonValue,
        question: state.question,
        searchParams: {
          fallbackUsed: state.fallbackUsed,
          knowledgeBaseIds: state.knowledgeBaseIds ?? [],
          retrievalError: state.retrievalError,
          model: this.deepSeek.enabled ? this.deepSeek.modelInfo.model : undefined,
          provider: this.deepSeek.enabled
            ? this.deepSeek.modelInfo.provider
            : undefined,
          topK: state.topK,
        },
        sourceSnapshot:
          state.searchResults as unknown as Prisma.InputJsonValue,
      },
    });

    return { retrievalTraceId: trace.id };
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
}
