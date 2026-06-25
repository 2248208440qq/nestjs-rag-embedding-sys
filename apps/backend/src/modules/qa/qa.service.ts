import { BadRequestException, Injectable } from '@nestjs/common';
import type { QaCitation, QaResponse } from '@repo/shared-types';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { QaRequestDto } from './dto/qa.dto';

@Injectable()
export class QaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  async ask(dto: QaRequestDto): Promise<QaResponse> {
    const question = dto.question.trim();
    if (!question) {
      throw new BadRequestException('question is required');
    }

    const topK = dto.topK ?? 5;
    const retrieval = await this.searchService.search({
      query: question,
      topK,
      knowledgeBaseIds: dto.knowledgeBaseIds,
    });
    const citations: QaCitation[] = retrieval.results.map((result) => ({
      articleNo: result.articleNo,
      chunkId: result.chunkId,
      documentId: result.documentId,
      sectionPath: result.sectionPath,
      title: result.title,
    }));
    const answer = this.composeExtractiveAnswer(question, retrieval.results);
    const trace = await this.prisma.qaTrace.create({
      data: {
        question,
        answer,
        searchParams: {
          knowledgeBaseIds: dto.knowledgeBaseIds ?? [],
          topK,
        },
        sourceSnapshot: retrieval.results as unknown as Prisma.InputJsonValue,
        citations: citations as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      answer,
      citations,
      retrievalTraceId: trace.id,
      sourceChunks: retrieval.results,
    };
  }

  private composeExtractiveAnswer(
    question: string,
    results: Array<{ articleNo?: string; content: string; title: string }>,
  ) {
    if (results.length === 0) {
      return `未检索到与“${question}”直接相关的法规依据。`;
    }

    const lines = results.slice(0, 3).map((result, index) => {
      const prefix = result.articleNo ? `${result.title} ${result.articleNo}` : result.title;
      const content = result.content.replace(/\s+/g, ' ').slice(0, 220);
      return `${index + 1}. ${prefix}：${content}`;
    });

    return [
      `基于当前知识库检索结果，问题“${question}”可先参考以下依据：`,
      ...lines,
      '该答案为检索式草稿，正式结论应结合完整法规上下文和引用来源复核。',
    ].join('\n');
  }
}
