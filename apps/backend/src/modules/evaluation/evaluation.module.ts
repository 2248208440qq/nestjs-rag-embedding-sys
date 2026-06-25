import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';

@Module({
  imports: [PrismaModule, SearchModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}
