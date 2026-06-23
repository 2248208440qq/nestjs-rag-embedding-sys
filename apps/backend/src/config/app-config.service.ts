import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get appName() {
    return this.configService.getOrThrow<string>('APP_NAME');
  }

  get apiVersion() {
    return this.configService.getOrThrow<string>('API_VERSION');
  }

  get nodeEnv() {
    return this.configService.getOrThrow<string>('NODE_ENV');
  }

  get isTest() {
    return this.nodeEnv === 'test';
  }

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get port() {
    return (
      this.configService.get<number>('BACKEND_PORT') ??
      this.configService.getOrThrow<number>('PORT')
    );
  }

  get embeddingBaseUrl() {
    return this.configService.getOrThrow<string>('EMBEDDING_BASE_URL');
  }

  get embeddingModel() {
    return this.configService.getOrThrow<string>('EMBEDDING_MODEL');
  }

  get embeddingBatchSize() {
    return this.configService.getOrThrow<number>('EMBEDDING_BATCH_SIZE');
  }

  get redisHost() {
    return this.configService.getOrThrow<string>('REDIS_HOST');
  }

  get redisPort() {
    return this.configService.getOrThrow<number>('REDIS_PORT');
  }

  get redisUsername() {
    return this.configService.get<string>('REDIS_USERNAME') || undefined;
  }

  get redisPassword() {
    return this.configService.get<string>('REDIS_PASSWORD') || undefined;
  }

  get redisDb() {
    return this.configService.getOrThrow<number>('REDIS_DB');
  }
}
