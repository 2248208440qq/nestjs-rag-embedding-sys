import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import {
  BindKnowledgeBaseDocumentsDto,
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
} from '@/modules/knowledge-base/dto/knowledge-base.dto';
import { KnowledgeBaseService } from '@/modules/knowledge-base/knowledge-base.service';

@Controller('knowledge-bases')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Get()
  list() {
    return this.knowledgeBaseService.list();
  }

  @Post()
  create(@Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeBaseService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.knowledgeBaseService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKnowledgeBaseDto,
  ) {
    return this.knowledgeBaseService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.knowledgeBaseService.remove(id);
  }

  @Post(':id/documents')
  bindDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BindKnowledgeBaseDocumentsDto,
  ) {
    return this.knowledgeBaseService.bindDocuments(id, dto);
  }
}
