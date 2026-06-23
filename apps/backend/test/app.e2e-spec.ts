import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { afterEach, describe, expect, it, beforeEach } from '@jest/globals';
import type {
  ApiSuccessResponse,
  DocumentExtractionResponse,
  DocumentUploadResponse,
} from '@repo/shared-type';
import JSZip from 'jszip';
import request from 'supertest';
import { configureApp } from '../src/app.setup';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let tempDir: string | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it('/api/health (GET)', () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    return request(server)
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('success');
        expect(body.data).toEqual({
          service: 'rag-embedding-backend',
          status: 'ok',
        });
      });
  });

  it('/api/documents/upload -> extract accepts docx files', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    tempDir = await mkdtemp(join(tmpdir(), 'rag-docx-'));
    const docxPath = join(tempDir, 'sample.docx');
    await writeFile(docxPath, await createDocxBuffer('合同解除责任测试文本'));

    const uploadResponse = await request(server)
      .post('/api/documents/upload')
      .field('sourceType', 'contract')
      .attach('file', docxPath)
      .expect(201);

    const uploadBody =
      uploadResponse.body as ApiSuccessResponse<DocumentUploadResponse>;
    expect(uploadBody.status).toBe('success');
    expect(uploadBody.data.document.originalFileName).toBe('sample.docx');

    const extractResponse = await request(server)
      .post(`/api/documents/${uploadBody.data.document.id}/extract`)
      .expect(201);

    const extractBody =
      extractResponse.body as ApiSuccessResponse<DocumentExtractionResponse>;
    expect(extractBody.status).toBe('success');
    expect(extractBody.data.extractedTextLength).toBeGreaterThan(0);
  });
});

async function createDocxBuffer(text: string): Promise<Buffer> {
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.folder('word')?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>
  </w:body>
</w:document>`,
  );

  return zip.generateAsync({ type: 'nodebuffer' });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
