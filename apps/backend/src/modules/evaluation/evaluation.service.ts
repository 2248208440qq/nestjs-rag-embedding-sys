import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { EvaluationMetrics, SearchResult } from '@repo/shared-types';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { SearchService } from '@/modules/search/search.service';
import { CreateEvaluationCaseDto, RunEvaluationDto } from '@/modules/evaluation/dto/evaluation.dto';
import { toEvaluationCase, toEvaluationRun } from '@/modules/evaluation/evaluation.mapper';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  async createCase(dto: CreateEvaluationCaseDto) {
    const item = await this.prisma.evaluationCase.create({
      data: {
        query: dto.query,
        expectedDocumentIds: dto.expectedDocumentIds ?? [],
        expectedChunkIds: dto.expectedChunkIds ?? [],
        expectedArticleRefs: dto.expectedArticleRefs ?? [],
        expectedKeywords: dto.expectedKeywords ?? [],
        difficulty: dto.difficulty,
        tags: dto.tags ?? [],
      },
    });

    return toEvaluationCase(item);
  }

  async listCases() {
    const items = await this.prisma.evaluationCase.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return items.map(toEvaluationCase);
  }

  async listRuns() {
    const items = await this.prisma.evaluationRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return items.map(toEvaluationRun);
  }

  async run(dto: RunEvaluationDto) {
    const evaluationCase = dto.caseId
      ? await this.prisma.evaluationCase.findUnique({ where: { id: dto.caseId } })
      : null;

    if (dto.caseId && !evaluationCase) {
      throw new NotFoundException(`Evaluation case ${dto.caseId} not found`);
    }

    const query = dto.query ?? evaluationCase?.query;
    if (!query) {
      throw new BadRequestException('query or caseId is required');
    }

    const topK = dto.topK ?? 20;
    const response = await this.searchService.search({ query, topK });
    const metrics = this.calculateMetrics(response.results, {
      expectedArticleRefs: evaluationCase?.expectedArticleRefs ?? [],
      expectedChunkIds: evaluationCase?.expectedChunkIds ?? [],
      expectedDocumentIds: evaluationCase?.expectedDocumentIds ?? [],
      expectedKeywords: evaluationCase?.expectedKeywords ?? [],
    });

    const run = await this.prisma.evaluationRun.create({
      data: {
        caseId: evaluationCase?.id,
        query,
        topK,
        searchParams: { topK },
        resultSnapshot: response.results as unknown as Prisma.InputJsonValue,
        metrics: metrics as unknown as Prisma.InputJsonValue,
      },
    });

    return toEvaluationRun(run);
  }

  private calculateMetrics(
    results: SearchResult[],
    expected: {
      expectedArticleRefs: string[];
      expectedChunkIds: string[];
      expectedDocumentIds: string[];
      expectedKeywords: string[];
    },
  ): EvaluationMetrics {
    const matchedDocumentIds = expected.expectedDocumentIds.filter((id) =>
      results.some((result) => result.documentId === id),
    );
    const matchedChunkIds = expected.expectedChunkIds.filter((id) =>
      results.some((result) => result.chunkId === id),
    );
    const matchedArticleRefs = expected.expectedArticleRefs.filter((ref) =>
      results.some(
        (result) =>
          result.articleNo?.includes(ref) ||
          result.sectionPath?.includes(ref) ||
          result.content.includes(ref),
      ),
    );
    const expectedTotal =
      expected.expectedDocumentIds.length +
      expected.expectedChunkIds.length +
      expected.expectedArticleRefs.length +
      expected.expectedKeywords.length;
    const keywordHits = expected.expectedKeywords.filter((keyword) =>
      results.some((result) => result.content.includes(keyword)),
    );
    const matchedTotal =
      matchedDocumentIds.length +
      matchedChunkIds.length +
      matchedArticleRefs.length +
      keywordHits.length;
    const firstHitIndex = results.findIndex(
      (result) =>
        expected.expectedDocumentIds.includes(result.documentId) ||
        expected.expectedChunkIds.includes(result.chunkId) ||
        (result.articleNo && expected.expectedArticleRefs.includes(result.articleNo)) ||
        expected.expectedKeywords.some((keyword) => result.content.includes(keyword)),
    );

    return {
      hitAtK: firstHitIndex >= 0,
      matchedArticleRefs,
      matchedChunkIds,
      matchedDocumentIds,
      precisionAtK: results.length ? matchedTotal / results.length : 0,
      recallAtK: expectedTotal ? matchedTotal / expectedTotal : 0,
      reciprocalRank: firstHitIndex >= 0 ? 1 / (firstHitIndex + 1) : 0,
    };
  }
}
