import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../config/config.module';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChunkingModule } from '../chunking/chunking.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ExtractorsModule } from '../extractors/extractors.module';
import { FilesModule } from '../files/files.module';
import { IndexJobsController } from './index-jobs.controller';
import { IndexJobsProcessor } from './index-jobs.processor';
import { INDEX_JOBS_QUEUE } from './index-jobs.queue';
import { IndexJobsService } from './index-jobs.service';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ChunkingModule,
    EmbeddingsModule,
    ExtractorsModule,
    FilesModule,
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: {
          db: config.redisDb,
          host: config.redisHost,
          password: config.redisPassword,
          port: config.redisPort,
          username: config.redisUsername,
        },
      }),
    }),
    BullModule.registerQueue({ name: INDEX_JOBS_QUEUE }),
  ],
  controllers: [IndexJobsController],
  providers: [IndexJobsProcessor, IndexJobsService],
  exports: [IndexJobsService],
})
export class IndexJobsModule {}
