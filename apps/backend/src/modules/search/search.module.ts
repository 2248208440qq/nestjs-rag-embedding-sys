import { Module } from '@nestjs/common';

import { EmbeddingsModule } from '@/modules/embeddings/embeddings.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { SearchController } from '@/modules/search/search.controller';
import { SearchService } from '@/modules/search/search.service';

@Module({
  imports: [PrismaModule, EmbeddingsModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
