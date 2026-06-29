import { Module } from '@nestjs/common';

import { TextExtractorService } from '@/modules/extractors/text-extractor.service';

@Module({
  providers: [TextExtractorService],
  exports: [TextExtractorService],
})
export class ExtractorsModule {}
