import { rm } from 'node:fs/promises';

import { Injectable } from '@nestjs/common';
import type { UploadFileResponse } from '@repo/shared-types';

import { decodeUploadFileName } from './file-name.util';

@Injectable()
export class FilesService {
  async persist(file: Express.Multer.File): Promise<UploadFileResponse> {
    const originalName = decodeUploadFileName(file.originalname);

    return {
      file: {
        id: file.filename,
        originalName,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
      },
    };
  }

  async remove(storagePath: string | null) {
    if (!storagePath) return false;

    try {
      await rm(storagePath, { force: true });
      return true;
    } catch {
      return false;
    }
  }
}
