import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { IndexJobsController } from './index-jobs.controller';
import { IndexJobsService } from './index-jobs.service';

@Module({
  imports: [PrismaModule],
  controllers: [IndexJobsController],
  providers: [IndexJobsService],
  exports: [IndexJobsService],
})
export class IndexJobsModule {}
