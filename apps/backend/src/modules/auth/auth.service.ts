import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import type { UserInfo, LoginResult, JwtPayload } from '@repo/shared-types';
import * as bcrypt from 'bcrypt';
import {
  ACCESS_TOKEN_BLACKLIST_PREFIX,
  CONSUMED_TOKENS_PREFIX,
  CONSUMED_TTL_BUFFER,
  REFRESH_TOKEN_PREFIX,
  USER_STATUS_PREFIX,
  USER_TOKENS_PREFIX,
} from '@/common/constants';
import { AppConfigService } from '@/config/app-config.service';
import { RedisService } from '@/redis/redis.service';
import { hashToken } from '@/common/utils/token.util';
import { AuthRepository } from '@/modules/auth/auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
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

    // Cache user status for the guard to check without a DB query
    await this.cacheUserStatus(user.id, 'active', ttlSeconds);

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
        const tokenHash = hashToken(accessToken);
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

    const hashedToken = hashToken(refreshToken);
    const tokenKey = `${REFRESH_TOKEN_PREFIX}${hashedToken}`;
    const userId = await this.redisService.get(tokenKey);

    if (!userId) {
      // --- Reuse detection ---
      // If the token was already consumed (rotated), an attacker may be
      // replaying it.  Revoke ALL tokens for this user immediately.
      const consumedUserId = await this.redisService.get(
        `${CONSUMED_TOKENS_PREFIX}${hashedToken}`,
      );
      if (consumedUserId) {
        await this.revokeAllUserTokens(consumedUserId);
        throw new UnauthorizedException(
          'Refresh token reuse detected — all sessions have been revoked',
        );
      }
      // --- End reuse detection ---

      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete the old refresh token and mark it as consumed (for reuse detection)
    await this.redisService.del(tokenKey);
    await this.redisService.srem(`${USER_TOKENS_PREFIX}${userId}`, hashedToken);

    const refreshTtl = this.appConfig.parseExpiresInSeconds(
      this.appConfig.jwtRefreshExpiresIn,
    );
    await this.redisService.setex(
      `${CONSUMED_TOKENS_PREFIX}${hashedToken}`,
      refreshTtl + CONSUMED_TTL_BUFFER,
      userId,
    );

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

    // Refresh the cached user status
    await this.cacheUserStatus(user.id, 'active', newRefresh.ttlSeconds);

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
    // Only essential fields go into the JWT.  realName / homePath / avatar
    // are retrieved via GET /user/info to keep the token compact.
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userInfo.id,
      username: userInfo.username,
      roles: userInfo.roles,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.appConfig.parseExpiresInSeconds(this.appConfig.jwtAccessExpiresIn),
      issuer: this.appConfig.jwtIssuer,
      audience: this.appConfig.jwtAudience,
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
    const hashedToken = hashToken(token);
    const ttlSeconds = this.appConfig.parseExpiresInSeconds(
      this.appConfig.jwtRefreshExpiresIn,
    );
    return { refreshToken: token, hashedToken, ttlSeconds };
  }

  /**
   * Stores a refresh token hash in Redis and tracks it in the user's token set.
   * The set TTL is set only on first creation, not reset on every addition,
   * to avoid extending the set lifetime beyond the oldest token's expiry.
   */
  private async storeRefreshToken(
    hashedToken: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const tokenKey = `${REFRESH_TOKEN_PREFIX}${hashedToken}`;
    const setKey = `${USER_TOKENS_PREFIX}${userId}`;

    await this.redisService.setex(tokenKey, ttlSeconds, userId);
    await this.redisService.sadd(setKey, hashedToken);

    // Only set TTL on the set if it doesn't already have one.
    // This prevents resetting the TTL on every login, which would cause
    // the set to outlive its oldest token.
    const setTtl = await this.redisService.ttl(setKey);
    if (setTtl === -1) {
      await this.redisService.expire(setKey, ttlSeconds);
    }
  }

  /**
   * Caches the user's status in Redis so the JwtAuthGuard can check it
   * without querying the database on every request.
   */
  private async cacheUserStatus(
    userId: string,
    status: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisService.setex(
      `${USER_STATUS_PREFIX}${userId}`,
      ttlSeconds,
      status,
    );
  }

  /**
   * Revokes all refresh tokens and cached status for a user.
   * Called when refresh-token reuse is detected.
   */
  private async revokeAllUserTokens(userId: string): Promise<void> {
    const tokenHashes = await this.redisService.smembers(
      `${USER_TOKENS_PREFIX}${userId}`,
    );
    if (tokenHashes.length > 0) {
      const keys = tokenHashes.flatMap((h) => [
        `${REFRESH_TOKEN_PREFIX}${h}`,
        `${CONSUMED_TOKENS_PREFIX}${h}`,
      ]);
      await this.redisService.delMany(keys);
    }
    await this.redisService.del(`${USER_TOKENS_PREFIX}${userId}`);
  }

  /**
   * Returns the remaining lifetime (in seconds) of an access token.
   * Returns 0 if the token is expired or cannot be decoded.
   */
  private getAccessTokenRemainingTtl(accessToken: string): number {
    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken, {
        secret: this.appConfig.jwtSecret,
        issuer: this.appConfig.jwtIssuer,
        audience: this.appConfig.jwtAudience,
      });
      const remaining = payload.exp - Math.floor(Date.now() / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }
}
