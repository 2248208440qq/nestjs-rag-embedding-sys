import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { LoginDto } from '@repo/shared-backend';
import { AppConfigService } from '@/config/app-config.service';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import type { UserInfo } from '@repo/shared-types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );

    // Set refresh token as HttpOnly cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: this.appConfig.isProduction,
      sameSite: this.appConfig.isProduction ? 'lax' : 'strict',
      maxAge: this.appConfig.parseExpiresInMs(this.appConfig.jwtRefreshExpiresIn),
      path: '/api/auth',
    });

    return {
      accessToken: result.accessToken,
      ...result.userInfo,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  async logout(
    @CurrentUser() user: UserInfo,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authHeader = request.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    await this.authService.logout(user.id, accessToken);

    response.clearCookie('refreshToken', { path: '/api/auth' });

    return null;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const refreshToken =
      typeof cookies?.refreshToken === 'string' ? cookies.refreshToken : '';

    const result = await this.authService.refresh(refreshToken);

    // Set new refresh token cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: this.appConfig.isProduction,
      sameSite: this.appConfig.isProduction ? 'lax' : 'strict',
      maxAge: this.appConfig.parseExpiresInMs(this.appConfig.jwtRefreshExpiresIn),
      path: '/api/auth',
    });

    return { accessToken: result.accessToken };
  }

  @Get('codes')
  @ApiOperation({ summary: 'Get current user permission codes' })
  async getAccessCodes(@CurrentUser() user: UserInfo) {
    const codes = await this.authService.getAccessCodes(user.id);
    return codes;
  }
}
