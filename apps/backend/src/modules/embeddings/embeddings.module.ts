import { Module } from '@nestjs/common';

import { EmbeddingClientService } from '@/modules/embeddings/embedding-client.service';

@Module({
  providers: [EmbeddingClientService],
  exports: [EmbeddingClientService],
})
export class EmbeddingsModule {}
