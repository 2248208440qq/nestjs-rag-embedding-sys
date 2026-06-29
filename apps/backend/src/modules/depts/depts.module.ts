import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { DeptsController } from '@/modules/depts/depts.controller';
import { DeptsService } from '@/modules/depts/depts.service';
import { DeptsRepository } from '@/modules/depts/depts.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DeptsController],
  providers: [DeptsService, DeptsRepository],
  exports: [DeptsService, DeptsRepository],
})
export class DeptsModule {}
