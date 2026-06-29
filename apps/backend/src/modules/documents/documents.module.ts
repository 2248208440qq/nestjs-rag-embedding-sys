import { Module } from '@nestjs/common';

import { IndexJobsModule } from '../index-jobs/index-jobs.module';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    PrismaModule,
    FilesModule,
    IndexJobsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
