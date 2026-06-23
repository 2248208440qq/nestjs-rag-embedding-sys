import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CustomLogger } from '@repo/shared-backend';
import Redis from 'ioredis';

import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  constructor(
    private readonly config: AppConfigService,
    private readonly logger: CustomLogger,
  ) {}

  async onModuleInit() {
    if (this.config.isTest) {
      return;
    }

    this.client = new Redis({
      host: this.config.redisHost,
      port: this.config.redisPort,
      username: this.config.redisUsername,
      password: this.config.redisPassword,
      db: this.config.redisDb,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(
          `Redis reconnecting in ${delay}ms (attempt ${times})`,
          RedisService.name,
        );
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected', RedisService.name);
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis error', error.stack, RedisService.name);
    });

    await this.waitUntilReady();
  }

  async onModuleDestroy() {
    if (!this.client) {
      return;
    }

    this.client.removeAllListeners('error');
    await this.client.quit();
    this.logger.log('Redis connection closed', RedisService.name);
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }

    return this.client;
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.getClient().exists(key);
    return result === 1;
  }

  async get(key: string): Promise<string | null> {
    return this.getClient().get(key);
  }

  async ping(): Promise<string> {
    return this.getClient().ping();
  }

  async incr(key: string): Promise<number> {
    return this.getClient().incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.getClient().decr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.getClient().expire(key, ttlSeconds);
  }

  private async waitUntilReady() {
    const client = this.getClient();

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Redis connection timeout')),
        5000,
      );

      client.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
}
