import { rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type { UploadFileResponse } from '@repo/shared-types';
import type { Response } from 'express';

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

  streamInline(
    response: Response,
    file: {
      mimeType: string;
      originalFileName: string;
      size: number;
      storagePath: string;
    },
  ) {
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', String(file.size));
    response.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(file.originalFileName)}`,
    );

    createReadStream(file.storagePath).pipe(response);
  }
}
