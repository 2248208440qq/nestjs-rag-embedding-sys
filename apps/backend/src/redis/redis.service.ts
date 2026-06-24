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

  /**
   * Whether the Redis client is connected and ready to accept commands.
   * Returns false in test mode or before initialisation.
   */
  get isConnected(): boolean {
    return this.client !== null;
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds !== undefined) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Set a key with an absolute TTL (in seconds). No-op when Redis is unavailable.
   */
  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (!this.client) return;
    await this.client.setex(key, ttlSeconds, value);
  }

  async del(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.del(key);
  }

  async delMany(keys: string[]): Promise<number> {
    if (!this.client || keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async ping(): Promise<string> {
    return this.getClient().ping();
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.decr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.expire(key, ttlSeconds);
  }

  // ---- Set operations (used for tracking user refresh tokens) ----

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.client) return 0;
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.client) return 0;
    return this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client) return [];
    return this.client.smembers(key);
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
