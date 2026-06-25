import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
  imports: [PrismaModule, SearchModule],
  controllers: [QaController],
  providers: [QaService],
})
export class QaModule {}
