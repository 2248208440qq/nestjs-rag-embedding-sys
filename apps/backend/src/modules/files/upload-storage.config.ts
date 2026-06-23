import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';

import { diskStorage } from 'multer';

import { decodeUploadFileName, sanitizeOriginalName } from './file-name.util';

const UPLOAD_DIR = 'uploads';

mkdirSync(UPLOAD_DIR, { recursive: true });

export const uploadStorage = diskStorage({
  destination: UPLOAD_DIR,
  filename: (_request, file, callback) => {
    const originalName = decodeUploadFileName(file.originalname);
    file.originalname = originalName;
    const extension = extname(originalName);
    const basename = sanitizeOriginalName(
      extension ? originalName.slice(0, -extension.length) : originalName,
    );
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    callback(null, `${basename || 'file'}-${suffix}${extension.toLowerCase()}`);
  },
});

export function resolveUploadPath(fileName: string) {
  return join(UPLOAD_DIR, fileName);
}
