import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { MenusController } from '@/modules/menus/menus.controller';
import { MenusService } from '@/modules/menus/menus.service';
import { MenusRepository } from '@/modules/menus/menus.repository';

@Module({
  imports: [PrismaModule],
  controllers: [MenusController],
  providers: [MenusService, MenusRepository],
  exports: [MenusService, MenusRepository],
})
export class MenusModule {}
