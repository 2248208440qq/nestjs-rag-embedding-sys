import { Global, Module } from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import { AppConfigModule } from '@/config/config.module';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
