import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AppConfigModule } from '@/config/config.module';
import { AppConfigService } from '@/config/app-config.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthRepository } from '@/modules/auth/auth.repository';

@Module({
  imports: [
    PrismaModule,
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.parseExpiresInSeconds(config.jwtAccessExpiresIn),
          issuer: config.jwtIssuer,
          audience: config.jwtAudience,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
