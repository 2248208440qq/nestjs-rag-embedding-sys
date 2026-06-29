import { Body, Controller, Post } from '@nestjs/common';
import type { SearchRequest } from '@repo/shared-types';

import { SearchService } from '@/modules/search/search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  search(@Body() request: SearchRequest) {
    return this.searchService.search(request);
  }
}
