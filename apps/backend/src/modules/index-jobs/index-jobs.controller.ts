import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { IndexJobQueryDto } from './dto/index-job-query.dto';
import { IndexJobsService } from './index-jobs.service';

@Controller('index-jobs')
export class IndexJobsController {
  constructor(private readonly indexJobsService: IndexJobsService) {}

  @Get()
  list(@Query() query: IndexJobQueryDto) {
    return this.indexJobsService.list({
      documentId: query.documentId,
      page: query.page ? Number(query.page) : undefined,
      pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      status: query.status,
      type: query.type,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.indexJobsService.findOne(id);
  }

  @Post(':id/retry')
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.indexJobsService.retry(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.indexJobsService.cancel(id);
  }

  @Post('documents/:documentId/rebuild')
  rebuildDocument(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return this.indexJobsService.createRebuildDocumentJob(documentId);
  }

  @Post('rebuild-all')
  rebuildAll() {
    return this.indexJobsService.createRebuildAllJob();
  }
}
