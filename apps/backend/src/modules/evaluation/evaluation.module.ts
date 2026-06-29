import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { SearchModule } from '@/modules/search/search.module';
import { EvaluationController } from '@/modules/evaluation/evaluation.controller';
import { EvaluationService } from '@/modules/evaluation/evaluation.service';

@Module({
  imports: [PrismaModule, SearchModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}
