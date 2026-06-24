import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserInfo } from '@repo/shared-types';

export const CurrentUser = createParamDecorator(
  (data: keyof UserInfo | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserInfo;
    return data ? user?.[data] : user;
  },
);
