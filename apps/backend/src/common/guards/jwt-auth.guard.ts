import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { UserInfo, JwtPayload } from '@repo/shared-types';
import {
  ACCESS_TOKEN_BLACKLIST_PREFIX,
  IS_PUBLIC_KEY,
  USER_STATUS_PREFIX,
} from '@/common/constants';
import { AppConfigService } from '@/config/app-config.service';
import { RedisService } from '@/redis/redis.service';
import { hashToken } from '@/common/utils/token.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private appConfig: AppConfigService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: UserInfo;
    }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Check if the token has been blacklisted (e.g. after logout)
    if (await this.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.appConfig.jwtSecret,
        issuer: this.appConfig.jwtIssuer,
        audience: this.appConfig.jwtAudience,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Check cached user status — if admin disabled the user, reject even
    // though the JWT itself has not expired yet.
    if (await this.isUserDisabled(payload.sub)) {
      throw new UnauthorizedException('User has been disabled');
    }

    // Map JwtPayload to UserInfo.  Only essential fields are in the JWT;
    // realName / homePath / avatar are fetched via GET /user/info.
    const userInfo: UserInfo = {
      id: payload.sub,
      username: payload.username,
      roles: payload.roles,
      realName: null,
    };
    request.user = userInfo;

    return true;
  }

  /**
   * Checks whether the given access token has been blacklisted in Redis.
   * Throws when Redis is unavailable in production (fail-safe).
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = hashToken(token);
    return this.redisService.exists(`${ACCESS_TOKEN_BLACKLIST_PREFIX}${tokenHash}`);
  }

  /**
   * Checks the Redis-cached user status.  If the cache entry says
   * `inactive` the user is disabled.  If there is no cache entry the
   * user is assumed active (the JWT was valid at issue time and the
   * short access-token TTL provides eventual consistency).
   */
  private async isUserDisabled(userId: string): Promise<boolean> {
    const status = await this.redisService.get(`${USER_STATUS_PREFIX}${userId}`);
    return status === 'inactive';
  }

  private extractTokenFromHeader(request: {
    headers: { authorization?: string };
  }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
