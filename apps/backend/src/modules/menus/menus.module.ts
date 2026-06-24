import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { MenusRepository } from './menus.repository';

@Module({
  imports: [PrismaModule],
  controllers: [MenusController],
  providers: [MenusService, MenusRepository],
  exports: [MenusService, MenusRepository],
})
export class MenusModule {}
