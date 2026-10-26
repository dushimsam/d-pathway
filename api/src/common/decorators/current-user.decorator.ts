import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/** The authenticated principal attached to the request by JwtStrategy. */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
