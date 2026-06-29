import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { INDEX_JOBS_QUEUE } from '@/common/constants';
import { AppConfigModule } from '@/config/config.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { QueueModule } from '@/queue/queue.module';
import { ChunkingModule } from '@/modules/chunking/chunking.module';
import { EmbeddingsModule } from '@/modules/embeddings/embeddings.module';
import { ExtractorsModule } from '@/modules/extractors/extractors.module';
import { FilesModule } from '@/modules/files/files.module';
import { DocumentIndexingService } from '@/modules/index-jobs/document-indexing.service';
import { IndexJobsController } from '@/modules/index-jobs/index-jobs.controller';
import { IndexJobsProcessor } from '@/modules/index-jobs/index-jobs.processor';
import { IndexJobsService } from '@/modules/index-jobs/index-jobs.service';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    QueueModule,
    ChunkingModule,
    EmbeddingsModule,
    ExtractorsModule,
    FilesModule,
    BullModule.registerQueue({ name: INDEX_JOBS_QUEUE }),
  ],
  controllers: [IndexJobsController],
  providers: [DocumentIndexingService, IndexJobsProcessor, IndexJobsService],
  exports: [IndexJobsService],
})
export class IndexJobsModule {}
