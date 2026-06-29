import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AppConfigService } from '@/config/app-config.service';
import { AppConfigModule } from '@/config/config.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: {
          db: config.redisDb,
          host: config.redisHost,
          password: config.redisPassword,
          port: config.redisPort,
          username: config.redisUsername,
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
