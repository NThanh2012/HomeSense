import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { UserPreferencesService } from './user-preferences.service.ts';

@UseGuards(TokenGuard)
@Controller('user-preferences')
export class UserPreferencesController {
    constructor(private readonly userPreferencesService: UserPreferencesService) {}

    @Get('me')
    async findMine(@CurrentUser() user: RequestUser) {
        const result = await this.userPreferencesService.findMine(user.id);
        return ApiResponse.success(result);
    }

    @Post('recompute')
    async recomputeMine(@CurrentUser() user: RequestUser) {
        const result = await this.userPreferencesService.recomputeMine(user.id);
        return ApiResponse.success(result);
    }
}
