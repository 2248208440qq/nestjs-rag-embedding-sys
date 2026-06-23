import { extname } from 'node:path';

const MOJIBAKE_PATTERN = /[ÃÂäåæçèéï¼]/;

export function decodeUploadFileName(originalName: string) {
  if (!MOJIBAKE_PATTERN.test(originalName)) {
    return originalName;
  }

  const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? originalName : decoded;
}

export function sanitizeOriginalName(originalName: string) {
  return decodeUploadFileName(originalName).replace(/[^\w.\-\u4e00-\u9fa5]+/g, '_');
}

export function inferTitleFromFileName(originalName: string) {
  const sanitized = sanitizeOriginalName(decodeUploadFileName(originalName));
  const extension = extname(sanitized);

  return extension ? sanitized.slice(0, -extension.length) : sanitized;
}
