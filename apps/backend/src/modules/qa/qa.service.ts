import { BadRequestException, Injectable } from '@nestjs/common';
import type { QaResponse } from '@repo/shared-types';

import { LegalQaGraphService } from '../agents/legal-qa-graph.service';
import { QaRequestDto } from './dto/qa.dto';

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
      topK: dto.topK ?? 5,
    });
  }
}
