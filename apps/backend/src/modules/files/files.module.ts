import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { FilesService } from '@/modules/files/files.service';
import { uploadStorage } from '@/modules/files/upload-storage.config';

@Module({
  imports: [
    MulterModule.register({
      storage: uploadStorage,
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  ],
  providers: [FilesService],
  exports: [FilesService, MulterModule],
})
export class FilesModule {}
