import { Module } from '@nestjs/common';

import { LegalChunkingService } from '@/modules/chunking/legal-chunking.service';

@Module({
  providers: [LegalChunkingService],
  exports: [LegalChunkingService],
})
export class ChunkingModule {}
