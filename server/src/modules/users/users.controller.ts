import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { UpdateUserDto } from './dto/update-user.dto.ts';
import { UsersService } from './users.service.ts';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(TokenGuard)
    @Get('me')
    async getMe(@CurrentUser() user: RequestUser) {
        const result = await this.usersService.getMe(user.id);
        return ApiResponse.success(result);
    }

    @UseGuards(TokenGuard)
    @Patch('me')
    async updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateUserDto) {
        const result = await this.usersService.updateMe(user.id, dto);
        return ApiResponse.success(result);
    }
}
