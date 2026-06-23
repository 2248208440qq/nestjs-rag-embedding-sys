import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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

  @Post(':id/extract')
  extract(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.extract(id);
  }

  @Post(':id/index')
  index(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.index(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }

  private normalizeBody(body: CreateDocumentDto): CreateDocumentDto {
    return {
      ...body,
      tags: typeof body.tags === 'string' ? [body.tags] : body.tags,
    };
  }
}
