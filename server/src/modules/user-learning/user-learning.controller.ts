import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { UpdateIntentStatusDto } from './dto/update-intent-status.dto.ts';
import { UpdateRealEstateContextDto } from './dto/update-real-estate-context.dto.ts';
import { UserLearningService } from './user-learning.service.ts';

@Controller('users/me')
@UseGuards(TokenGuard)
export class UserLearningController {
    constructor(private readonly service: UserLearningService) {}

    @Get('real-estate-context')
    async getContext(@CurrentUser() user: RequestUser) {
        return ApiResponse.success(await this.service.getRealEstateContext(user.id));
    }

    @Patch('real-estate-context')
    async updateContext(@CurrentUser() user: RequestUser, @Body() dto: UpdateRealEstateContextDto) {
        return ApiResponse.success(await this.service.updateRealEstateContext(user.id, dto));
    }

    @Get('intents')
    async findIntents(@CurrentUser() user: RequestUser) {
        return ApiResponse.success(await this.service.findIntents(user.id));
    }

    @Patch('intents/:id/status')
    async updateIntentStatus(
        @CurrentUser() user: RequestUser,
        @Param('id') id: string,
        @Body() dto: UpdateIntentStatusDto,
    ) {
        return ApiResponse.success(await this.service.updateIntentStatus(user.id, id, dto));
    }

    @Get('real-estate-data/export')
    async exportData(@CurrentUser() user: RequestUser) {
        return ApiResponse.success(await this.service.exportNormalizedLearningData(user.id));
    }

    @Delete('real-estate-data')
    async deleteData(@CurrentUser() user: RequestUser) {
        return ApiResponse.success(await this.service.deleteNormalizedLearningData(user.id));
    }
}

@Controller('admin/users')
@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserLearningController {
    constructor(private readonly service: UserLearningService) {}

    @Get(':userId/intents')
    async findIntents(@Param('userId') userId: string) {
        return ApiResponse.success(await this.service.findIntents(userId));
    }

    @Get(':userId/preference-signals')
    async findSignals(@Param('userId') userId: string) {
        return ApiResponse.success(await this.service.findSignals(userId));
    }
}
