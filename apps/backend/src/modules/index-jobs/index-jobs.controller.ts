import {
  Controller,
  Get,
  HttpCode,
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
      parentJobId: query.parentJobId,
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

  @Post('rebuild-all')
  @HttpCode(202)
  rebuildAll() {
    return this.indexJobsService.createRebuildAllJob();
  }
}
