import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { UserInfo, JwtPayload } from '@repo/shared-types';
import { RedisService } from '../../redis/redis.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Prefix for access-token blacklist keys in Redis.
 * When a user logs out, their access token is blacklisted with a TTL
 * equal to the token's remaining lifetime.
 */
const ACCESS_TOKEN_BLACKLIST_PREFIX = 'auth:blacklist:';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
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

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'rag-embedding'),
        audience: this.configService.get<string>('JWT_AUDIENCE', 'rag-embedding-api'),
      });

      // Map JwtPayload to UserInfo — all fields come from the signed payload
      const userInfo: UserInfo = {
        id: payload.sub,
        username: payload.username,
        roles: payload.roles,
        realName: payload.realName ?? null,
        homePath: payload.homePath,
        avatar: payload.avatar,
      };
      request.user = userInfo;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  /**
   * Checks whether the given access token has been blacklisted in Redis.
   * Returns false when Redis is unavailable (e.g. in test mode).
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    return this.redisService.exists(`${ACCESS_TOKEN_BLACKLIST_PREFIX}${tokenHash}`);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private extractTokenFromHeader(request: {
    headers: { authorization?: string };
  }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export { ACCESS_TOKEN_BLACKLIST_PREFIX };
