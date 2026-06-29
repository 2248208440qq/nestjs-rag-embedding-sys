import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

import { DOCX_EXTENSIONS, PDF_EXTENSIONS, TEXT_EXTENSIONS } from '@/common/constants';

@Injectable()
export class TextExtractorService {
  private readonly logger = new Logger(TextExtractorService.name);

  async extract(filePath: string, mimeType?: string): Promise<string> {
    const extension = extname(filePath).toLowerCase();

    if (this.isPlainText(mimeType, extension)) {
      const raw = await readFile(filePath, 'utf8');
      return this.normalizeText(this.maybeStripHtml(raw, mimeType, extension));
    }

    if (this.isDocx(mimeType, extension)) {
      return this.extractDocx(filePath);
    }

    if (this.isPdf(mimeType, extension)) {
      return this.extractPdf(filePath);
    }

    throw new BadRequestException(
      `Unsupported file type for extraction: ${mimeType || extension || 'unknown'}`,
    );
  }

  private isPlainText(mimeType: string | undefined, extension: string) {
    return (
      Boolean(mimeType?.startsWith('text/')) ||
      mimeType === 'application/json' ||
      TEXT_EXTENSIONS.has(extension)
    );
  }

  private isDocx(mimeType: string | undefined, extension: string) {
    return (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      DOCX_EXTENSIONS.has(extension)
    );
  }

  private isPdf(mimeType: string | undefined, extension: string) {
    return mimeType === 'application/pdf' || PDF_EXTENSIONS.has(extension);
  }

  private async extractDocx(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return this.normalizeText(result.value);
  }

  private async extractPdf(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
      const result = await parser.getText();
      return this.normalizeText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  private maybeStripHtml(text: string, mimeType: string | undefined, extension: string) {
    if (mimeType !== 'text/html' && extension !== '.html' && extension !== '.htm') {
      return text;
    }

    return text
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  }

  private normalizeText(text: string) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
