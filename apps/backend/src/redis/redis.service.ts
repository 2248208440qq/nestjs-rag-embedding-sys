import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
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

  /**
   * Returns the Redis client, or throws when Redis is unavailable in
   * non-test environments.  In test mode the caller is responsible for
   * handling a null return (graceful degradation).
   */
  private getClientOrThrow(): Redis | null {
    if (!this.client) {
      if (this.config.isTest) return null;
      throw new ServiceUnavailableException(
        'Redis service is unavailable — authentication operations cannot proceed safely',
      );
    }
    return this.client;
  }

  async exists(key: string): Promise<boolean> {
    const client = this.getClientOrThrow();
    if (!client) return false;
    const result = await client.exists(key);
    return result === 1;
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClientOrThrow();
    if (!client) return null;
    return client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.getClientOrThrow();
    if (!client) return;
    if (ttlSeconds !== undefined) {
      await client.set(key, value, 'EX', ttlSeconds);
    } else {
      await client.set(key, value);
    }
  }

  /**
   * Set a key with an absolute TTL (in seconds). No-op when Redis is unavailable.
   */
  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    const client = this.getClientOrThrow();
    if (!client) return;
    await client.setex(key, ttlSeconds, value);
  }

  async del(key: string): Promise<number> {
    const client = this.getClientOrThrow();
    if (!client) return 0;
    return client.del(key);
  }

  async delMany(keys: string[]): Promise<number> {
    const client = this.getClientOrThrow();
    if (!client || keys.length === 0) return 0;
    return client.del(...keys);
  }

  async ping(): Promise<string> {
    return this.getClient().ping();
  }

  async incr(key: string): Promise<number> {
    const client = this.getClientOrThrow();
    if (!client) return 0;
    return client.incr(key);
  }

  async decr(key: string): Promise<number> {
    const client = this.getClientOrThrow();
    if (!client) return 0;
    return client.decr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const client = this.getClientOrThrow();
    if (!client) return;
    await client.expire(key, ttlSeconds);
  }

  // ---- Set operations (used for tracking user refresh tokens) ----

  async sadd(key: string, ...members: string[]): Promise<number> {
    const client = this.getClientOrThrow();
    if (!client) return 0;
    return client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const client = this.getClientOrThrow();
    if (!client) return 0;
    return client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    const client = this.getClientOrThrow();
    if (!client) return [];
    return client.smembers(key);
  }

  /**
   * Returns the remaining TTL (in seconds) of a key.
   * -2 = key does not exist, -1 = key exists but has no expiry, >0 = seconds remaining.
   */
  async ttl(key: string): Promise<number> {
    const client = this.getClientOrThrow();
    if (!client) return -2;
    return client.ttl(key);
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
