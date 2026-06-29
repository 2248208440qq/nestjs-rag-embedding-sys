import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { RolesController } from '@/modules/roles/roles.controller';
import { RolesService } from '@/modules/roles/roles.service';
import { RolesRepository } from '@/modules/roles/roles.repository';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
  exports: [RolesService, RolesRepository],
})
export class RolesModule {}
