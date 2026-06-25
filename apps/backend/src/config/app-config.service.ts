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

  get jwtSecret() {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  get jwtAccessExpiresIn() {
    return this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN');
  }

  get jwtRefreshExpiresIn() {
    return this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
  }

  get jwtIssuer() {
    return this.configService.getOrThrow<string>('JWT_ISSUER');
  }

  get jwtAudience() {
    return this.configService.getOrThrow<string>('JWT_AUDIENCE');
  }

  /**
   * Parse a duration string like "15m", "7d", "2h" into seconds.
   * Returns 7 days in seconds as the default fallback.
   */
  parseExpiresInSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60;

    const value = parseInt(match[1]!, 10);
    const unit = match[2]!;

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }

  /**
   * Parse a duration string into milliseconds (for cookie maxAge).
   */
  parseExpiresInMs(expiresIn: string): number {
    return this.parseExpiresInSeconds(expiresIn) * 1000;
  }
}
