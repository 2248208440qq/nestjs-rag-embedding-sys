import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import type { UserInfo, LoginResult, JwtPayload } from '@repo/shared-types';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RedisService } from '../../redis/redis.service';
import { ACCESS_TOKEN_BLACKLIST_PREFIX } from '../../common/guards/jwt-auth.guard';

/** Redis key prefix for individual refresh tokens: `auth:refresh:{sha256Hash}` → userId */
const REFRESH_TOKEN_PREFIX = 'auth:refresh:';
/** Redis key prefix for the set of refresh-token hashes belonging to a user. */
const USER_TOKENS_PREFIX = 'auth:user_tokens:';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<LoginResult & { refreshToken: string }> {
    const user = await this.authRepository.findUserByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Username or password is incorrect');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username or password is incorrect');
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const userInfo: UserInfo = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      roles,
      homePath: user.homePath ?? undefined,
      avatar: user.avatar ?? undefined,
    };

    const accessToken = this.generateAccessToken(userInfo);
    const { refreshToken, hashedToken, ttlSeconds } =
      this.createRefreshToken();

    // Store refresh token in Redis with automatic TTL expiry
    await this.storeRefreshToken(hashedToken, user.id, ttlSeconds);

    return { accessToken, userInfo, refreshToken };
  }

  /**
   * Logs out a user by:
   * 1. Deleting all their refresh tokens from Redis
   * 2. Blacklisting the current access token so it expires immediately
   */
  async logout(userId: string, accessToken?: string): Promise<void> {
    // Remove all refresh tokens for this user
    const tokenHashes = await this.redisService.smembers(
      `${USER_TOKENS_PREFIX}${userId}`,
    );
    if (tokenHashes.length > 0) {
      const keys = tokenHashes.map((h) => `${REFRESH_TOKEN_PREFIX}${h}`);
      await this.redisService.delMany(keys);
    }
    await this.redisService.del(`${USER_TOKENS_PREFIX}${userId}`);

    // Blacklist the access token with a TTL equal to its remaining lifetime
    if (accessToken) {
      const remainingTtl = this.getAccessTokenRemainingTtl(accessToken);
      if (remainingTtl > 0) {
        const tokenHash = this.hashToken(accessToken);
        await this.redisService.setex(
          `${ACCESS_TOKEN_BLACKLIST_PREFIX}${tokenHash}`,
          remainingTtl,
          '1',
        );
      }
    }
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided');
    }

    const hashedToken = this.hashToken(refreshToken);
    const userId = await this.redisService.get(
      `${REFRESH_TOKEN_PREFIX}${hashedToken}`,
    );

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete the old refresh token (rotation)
    await this.redisService.del(`${REFRESH_TOKEN_PREFIX}${hashedToken}`);
    await this.redisService.srem(`${USER_TOKENS_PREFIX}${userId}`, hashedToken);

    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User is inactive');
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const userInfo: UserInfo = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      roles,
      homePath: user.homePath ?? undefined,
      avatar: user.avatar ?? undefined,
    };

    const accessToken = this.generateAccessToken(userInfo);
    const newRefresh = this.createRefreshToken();
    await this.storeRefreshToken(newRefresh.hashedToken, user.id, newRefresh.ttlSeconds);

    return {
      accessToken,
      refreshToken: newRefresh.refreshToken,
    };
  }

  async getAccessCodes(userId: string): Promise<string[]> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roleIds = user.roles.map((ur) => ur.roleId);
    const roleMenus = await this.authRepository.findMenusByRoleIds(roleIds);

    // Button-type menus serve as permission codes
    const codes = roleMenus
      .filter((rm) => rm.menu.type === 'button' && rm.menu.status === 'active')
      .map((rm) => rm.menu.name);

    // Deduplicate
    return [...new Set(codes)];
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private generateAccessToken(userInfo: UserInfo): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userInfo.id,
      username: userInfo.username,
      roles: userInfo.roles,
      realName: userInfo.realName,
      homePath: userInfo.homePath,
      avatar: userInfo.avatar,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
      issuer: this.configService.get<string>('JWT_ISSUER', 'rag-embedding'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'rag-embedding-api'),
    });
  }

  /**
   * Generates a random refresh token and its SHA-256 hash (used as the Redis key).
   * The hash is safe to use as a lookup key because the raw token is 256 bits of entropy.
   */
  private createRefreshToken(): {
    refreshToken: string;
    hashedToken: string;
    ttlSeconds: number;
  } {
    const token = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);
    const ttlSeconds = this.parseExpiresInSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
    return { refreshToken: token, hashedToken, ttlSeconds };
  }

  /**
   * Stores a refresh token hash in Redis and tracks it in the user's token set.
   */
  private async storeRefreshToken(
    hashedToken: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisService.setex(
      `${REFRESH_TOKEN_PREFIX}${hashedToken}`,
      ttlSeconds,
      userId,
    );
    await this.redisService.sadd(`${USER_TOKENS_PREFIX}${userId}`, hashedToken);
    await this.redisService.expire(
      `${USER_TOKENS_PREFIX}${userId}`,
      ttlSeconds,
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Returns the remaining lifetime (in seconds) of an access token.
   * Returns 0 if the token is expired or cannot be decoded.
   */
  private getAccessTokenRemainingTtl(accessToken: string): number {
    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'rag-embedding'),
        audience: this.configService.get<string>('JWT_AUDIENCE', 'rag-embedding-api'),
      });
      const remaining = payload.exp - Math.floor(Date.now() / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }

  private parseExpiresInSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // default 7d in seconds

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
}
