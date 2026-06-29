import { Module } from '@nestjs/common';

import { IndexJobsModule } from '@/modules/index-jobs/index-jobs.module';
import { FilesModule } from '@/modules/files/files.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { DocumentsController } from '@/modules/documents/documents.controller';
import { DocumentsService } from '@/modules/documents/documents.service';

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
