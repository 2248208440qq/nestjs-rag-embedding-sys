import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { ChunkingModule } from '../chunking/chunking.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ExtractorsModule } from '../extractors/extractors.module';
import { IndexJobsModule } from '../index-jobs/index-jobs.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { uploadStorage } from '../files/upload-storage.config';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: uploadStorage,
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
    ChunkingModule,
    EmbeddingsModule,
    ExtractorsModule,
    IndexJobsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
