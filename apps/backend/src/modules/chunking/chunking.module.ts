import { Module } from '@nestjs/common';

import { LegalChunkingService } from './legal-chunking.service';

@Module({
  providers: [LegalChunkingService],
  exports: [LegalChunkingService],
})
export class ChunkingModule {}
