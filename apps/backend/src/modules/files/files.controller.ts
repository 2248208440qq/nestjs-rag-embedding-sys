import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadFileResponse } from '@repo/shared-types';

import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UploadFileResponse> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    return this.filesService.persist(file);
  }
}
