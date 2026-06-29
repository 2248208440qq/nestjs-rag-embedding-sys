import { BadRequestException, Injectable } from '@nestjs/common';
import type { QaResponse } from '@repo/shared-types';

import { DEFAULT_QA_TOP_K, MAX_QA_TOP_K } from '@/common/constants';
import { LegalQaGraphService } from '@/modules/agents/legal-qa-graph.service';
import { QaRequestDto } from '@/modules/qa/dto/qa.dto';

@Injectable()
export class QaService {
  constructor(private readonly legalQaGraph: LegalQaGraphService) {}

  async ask(dto: QaRequestDto): Promise<QaResponse> {
    const question = dto.question.trim();
    if (!question) {
      throw new BadRequestException('question is required');
    }

    return this.legalQaGraph.run({
      knowledgeBaseIds: dto.knowledgeBaseIds,
      question,
      topK: Math.min(Math.max(dto.topK ?? DEFAULT_QA_TOP_K, 1), MAX_QA_TOP_K),
    });
  }
}
