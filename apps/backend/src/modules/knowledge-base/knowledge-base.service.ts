import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import {
  BindKnowledgeBaseDocumentsDto,
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
} from './dto/knowledge-base.dto';
import { toKnowledgeBase } from './knowledge-base.mapper';

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKnowledgeBaseDto) {
    const item = await this.prisma.knowledgeBase.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        category: dto.category,
        status: dto.status ?? 'active',
      },
      include: { _count: { select: { documents: true } } },
    });

    return toKnowledgeBase(item);
  }

  async list() {
    const items = await this.prisma.knowledgeBase.findMany({
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return items.map(toKnowledgeBase);
  }

  async findOne(id: string) {
    const item = await this.prisma.knowledgeBase.findUnique({
      where: { id },
      include: { _count: { select: { documents: true } } },
    });

    if (!item) {
      throw new NotFoundException(`Knowledge base ${id} not found`);
    }

    return toKnowledgeBase(item);
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto) {
    await this.ensureExists(id);
    const item = await this.prisma.knowledgeBase.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        status: dto.status,
      },
      include: { _count: { select: { documents: true } } },
    });

    return toKnowledgeBase(item);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.knowledgeBase.delete({ where: { id } });
    return { id };
  }

  async bindDocuments(id: string, dto: BindKnowledgeBaseDocumentsDto) {
    await this.ensureExists(id);
    await this.prisma.$transaction([
      this.prisma.knowledgeBaseDocument.deleteMany({
        where: { knowledgeBaseId: id },
      }),
      ...dto.documentIds.map((documentId) =>
        this.prisma.knowledgeBaseDocument.create({
          data: {
            knowledgeBaseId: id,
            documentId,
          },
        }),
      ),
    ]);

    return this.findOne(id);
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.knowledgeBase.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Knowledge base ${id} not found`);
    }
  }
}
