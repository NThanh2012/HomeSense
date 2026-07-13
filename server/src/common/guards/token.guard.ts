import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ResponseCode } from '../constants/response-code.constant.ts';
import { ApiException } from '../exceptions/api.exception.ts';
import { RequestWithUser } from '../types/request-user.type.ts';
import { UsersService } from '../../modules/users/users.service.ts';

@Injectable()
export class TokenGuard implements CanActivate {
    constructor(private readonly usersService: UsersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const token = this.extractToken(request.headers.authorization);

        if (!token) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'Token không hợp lệ');
        }

        const user = await this.usersService.findActiveByToken(token);
        if (!user) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'Token không hợp lệ');
        }

        request.user = this.usersService.toRequestUser(user);
        return true;
    }

    private extractToken(authorization?: string): string | null {
        if (!authorization) {
            return null;
        }

        const [type, token] = authorization.split(' ');
        if (type !== 'Bearer' || !token) {
            return null;
        }

        return token;
    }
}
