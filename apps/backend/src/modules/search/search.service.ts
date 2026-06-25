import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { SearchRequest, SearchResponse, SearchResult } from '@repo/shared-types';

import { EmbeddingClientService } from '../embeddings/embedding-client.service';
import { PrismaService } from '../../prisma/prisma.service';

interface SearchRow {
  chunk_id: string;
  document_id: string;
  title: string;
  content: string;
  score: number | null;
  section_path: string | null;
  article_no: string | null;
  metadata: Record<string, unknown>;
}

interface RankedSearchRow extends SearchRow {
  rank: number;
  source: 'vector' | 'keyword';
}

interface MergedSearchRow extends SearchRow {
  vectorRank?: number;
  keywordRank?: number;
  vectorScore?: number;
  keywordScore?: number;
  rrfScore: number;
}

const RRF_K = 60;
const MIN_CANDIDATE_LIMIT = 50;
const MAX_CANDIDATE_LIMIT = 100;

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingClientService,
  ) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const query = request.query?.trim();
    if (!query) {
      throw new BadRequestException('query is required');
    }

    const topK = Math.min(Math.max(request.topK || 20, 1), 50);
    const candidateLimit = Math.min(
      Math.max(topK * 5, MIN_CANDIDATE_LIMIT),
      MAX_CANDIDATE_LIMIT,
    );
    const filters = this.buildFilters(request);
    const [queryVector] = await this.embeddings.embed(query);
    if (!queryVector) {
      return {
        query,
        results: [],
      };
    }

    const [vectorRows, keywordRows] = await Promise.all([
      this.searchByVector(queryVector, candidateLimit, filters),
      this.searchByKeyword(query, candidateLimit, filters),
    ]);

    return {
      query,
      results: this.mergeResults(vectorRows, keywordRows).slice(0, topK),
    };
  }

  private searchByVector(
    queryVector: number[],
    limit: number,
    filters: Prisma.Sql,
  ) {
    return this.prisma.$queryRaw<SearchRow[]>`
      SELECT
        c.id AS chunk_id,
        c.document_id,
        d.title,
        c.content,
        1 - (c.embedding <=> ${this.toVectorLiteral(queryVector)}::vector) AS score,
        c.section_path,
        c.article_no,
        c.metadata
      FROM knowledge_document_chunks c
      INNER JOIN knowledge_documents d ON d.id = c.document_id
      WHERE ${filters}
        AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${this.toVectorLiteral(queryVector)}::vector
      LIMIT ${limit}
    `.then((rows) => this.rankRows(rows, 'vector'));
  }

  private searchByKeyword(query: string, limit: number, filters: Prisma.Sql) {
    const likeQuery = `%${query}%`;

    return this.prisma.$queryRaw<SearchRow[]>`
      SELECT
        c.id AS chunk_id,
        c.document_id,
        d.title,
        c.content,
        GREATEST(
          similarity(c.content, ${query}),
          similarity(COALESCE(c.article_no, ''), ${query}) * 1.4,
          similarity(COALESCE(c.section_path, ''), ${query}),
          similarity(d.title, ${query}) * 1.5
        ) AS score,
        c.section_path,
        c.article_no,
        c.metadata
      FROM knowledge_document_chunks c
      INNER JOIN knowledge_documents d ON d.id = c.document_id
      WHERE ${filters}
        AND (
          c.content ILIKE ${likeQuery}
          OR COALESCE(c.article_no, '') ILIKE ${likeQuery}
          OR COALESCE(c.section_path, '') ILIKE ${likeQuery}
          OR d.title ILIKE ${likeQuery}
          OR c.content % ${query}
          OR COALESCE(c.article_no, '') % ${query}
          OR COALESCE(c.section_path, '') % ${query}
          OR d.title % ${query}
        )
      ORDER BY score DESC
      LIMIT ${limit}
    `.then((rows) => this.rankRows(rows, 'keyword'));
  }

  private rankRows(rows: SearchRow[], source: 'vector' | 'keyword') {
    return rows.map((row, index): RankedSearchRow => ({
      ...row,
      rank: index + 1,
      source,
    }));
  }

  private mergeResults(
    vectorRows: RankedSearchRow[],
    keywordRows: RankedSearchRow[],
  ): SearchResult[] {
    const merged = new Map<string, MergedSearchRow>();

    for (const row of [...vectorRows, ...keywordRows]) {
      const key = row.article_no ? `${row.document_id}:${row.article_no}` : row.chunk_id;
      const existing = merged.get(key);
      const rrfIncrement = 1 / (RRF_K + row.rank);
      const numericScore = Number(row.score ?? 0);

      if (!existing) {
        merged.set(key, {
          ...row,
          rrfScore: rrfIncrement,
          ...(row.source === 'vector'
            ? { vectorRank: row.rank, vectorScore: numericScore }
            : { keywordRank: row.rank, keywordScore: numericScore }),
        });
        continue;
      }

      existing.rrfScore += rrfIncrement;

      if (row.source === 'vector') {
        existing.vectorRank = Math.min(existing.vectorRank ?? row.rank, row.rank);
        existing.vectorScore = Math.max(existing.vectorScore ?? numericScore, numericScore);
      } else {
        existing.keywordRank = Math.min(existing.keywordRank ?? row.rank, row.rank);
        existing.keywordScore = Math.max(existing.keywordScore ?? numericScore, numericScore);
      }

      if (numericScore > Number(existing.score ?? 0)) {
        existing.chunk_id = row.chunk_id;
        existing.content = row.content;
        existing.score = row.score;
        existing.section_path = row.section_path;
        existing.article_no = row.article_no;
        existing.metadata = row.metadata;
      }
    }

    return Array.from(merged.values())
      .sort((left, right) => right.rrfScore - left.rrfScore)
      .map((row): SearchResult => {
        const matchType =
          row.vectorRank && row.keywordRank
            ? 'hybrid'
            : row.vectorRank
              ? 'vector'
              : 'keyword';

        return {
          chunkId: row.chunk_id,
          documentId: row.document_id,
          title: row.title,
          content: row.content,
          score: Math.min(row.rrfScore * 30, 1),
          matchType,
          scores: {
            rrf: row.rrfScore,
            ...(row.vectorScore !== undefined ? { vector: row.vectorScore } : {}),
            ...(row.keywordScore !== undefined ? { keyword: row.keywordScore } : {}),
          },
          sectionPath: row.section_path ?? undefined,
          articleNo: row.article_no ?? undefined,
          metadata: row.metadata || {},
        };
      });
  }

  private buildFilters(request: SearchRequest) {
    const conditions: Prisma.Sql[] = [Prisma.sql`d.status = 'indexed'`];

    if (request.documentIds?.length) {
      conditions.push(Prisma.sql`c.document_id IN (${Prisma.join(
        request.documentIds.map((id) => Prisma.sql`${id}::uuid`),
      )})`);
    }

    if (request.knowledgeBaseIds?.length) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1
        FROM knowledge_base_documents kbd
        WHERE kbd.document_id = d.id
          AND kbd.knowledge_base_id IN (${Prisma.join(
            request.knowledgeBaseIds.map((id) => Prisma.sql`${id}::uuid`),
          )})
      )`);
    }

    if (request.sourceTypes?.length) {
      conditions.push(Prisma.sql`d."sourceType"::text IN (${Prisma.join(
        request.sourceTypes,
      )})`);
    }

    return Prisma.join(conditions, ' AND ');
  }

  private toVectorLiteral(vector: number[]) {
    return `[${vector.join(',')}]`;
  }
}
