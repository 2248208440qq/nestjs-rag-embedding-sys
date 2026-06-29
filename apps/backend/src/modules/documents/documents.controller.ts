import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import type { CreateIndexJobResponse } from '@repo/shared-types';

import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';
import { FilesService } from '../files/files.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly filesService: FilesService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    return this.documentsService.upload(file, this.normalizeBody(body));
  }

  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/file')
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ) {
    const file = await this.documentsService.getFile(id);
    this.filesService.streamInline(response, file);
  }

  @Post(':id/extract')
  @HttpCode(202)
  extract(@Param('id', ParseUUIDPipe) id: string): Promise<CreateIndexJobResponse> {
    return this.documentsService.extract(id);
  }

  @Post(':id/index')
  @HttpCode(202)
  index(@Param('id', ParseUUIDPipe) id: string): Promise<CreateIndexJobResponse> {
    return this.documentsService.index(id);
  }

  @Delete(':id')
  @HttpCode(202)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<CreateIndexJobResponse> {
    return this.documentsService.remove(id);
  }

  private normalizeBody(body: CreateDocumentDto): CreateDocumentDto {
    return {
      ...body,
      tags: typeof body.tags === 'string' ? [body.tags] : body.tags,
    };
  }
}
