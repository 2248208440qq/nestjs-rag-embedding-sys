import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { KnowledgeBaseController } from '@/modules/knowledge-base/knowledge-base.controller';
import { KnowledgeBaseService } from '@/modules/knowledge-base/knowledge-base.service';

@Module({
  imports: [PrismaModule],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
