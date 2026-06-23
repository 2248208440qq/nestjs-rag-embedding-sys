import { Module } from '@nestjs/common';

import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [EmbeddingsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
