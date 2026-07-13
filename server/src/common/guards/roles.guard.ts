import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ResponseCode } from '../constants/response-code.constant.ts';
import { ROLES_KEY } from '../decorators/roles.decorator.ts';
import { ApiException } from '../exceptions/api.exception.ts';
import { RequestWithUser } from '../types/request-user.type.ts';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!roles || roles.length < 1) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const user = request.user;

        if (!user || !roles.includes(user.role)) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Bạn không có quyền truy cập',
            );
        }

        return true;
    }
}
