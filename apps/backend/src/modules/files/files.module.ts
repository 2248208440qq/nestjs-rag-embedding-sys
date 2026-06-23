import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { uploadStorage } from './upload-storage.config';

@Module({
  imports: [
    MulterModule.register({
      storage: uploadStorage,
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
