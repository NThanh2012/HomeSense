import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { AuthService } from './auth.service.ts';
import { LoginDto } from './dto/login.dto.ts';
import { RegisterDto } from './dto/register.dto.ts';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        const result = await this.authService.register(dto);
        return ApiResponse.success(result);
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const result = await this.authService.login(dto);
        return ApiResponse.success(result);
    }

    @UseGuards(TokenGuard)
    @Post('logout')
    async logout(@CurrentUser() user: RequestUser) {
        const result = await this.authService.logout(user);
        return ApiResponse.success(result);
    }
}
