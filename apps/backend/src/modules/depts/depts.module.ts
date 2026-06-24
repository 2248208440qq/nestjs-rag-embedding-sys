import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DeptsController } from './depts.controller';
import { DeptsService } from './depts.service';
import { DeptsRepository } from './depts.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DeptsController],
  providers: [DeptsService, DeptsRepository],
  exports: [DeptsService, DeptsRepository],
})
export class DeptsModule {}
