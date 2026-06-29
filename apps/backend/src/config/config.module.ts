import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService } from '@/config/app-config.service';
import { validateEnv } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.docker'],
      validate: validateEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [ConfigModule, AppConfigService],
})
export class AppConfigModule {}
