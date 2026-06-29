import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';
import { UsersRepository } from '@/modules/users/users.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
