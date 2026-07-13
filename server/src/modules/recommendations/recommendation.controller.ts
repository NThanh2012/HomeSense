import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { CreateRecommendationFeedbackDto } from './dto/feedback.dto.ts';
import { FilterDemandMatchesDto } from './dto/match-filter.dto.ts';
import { UpdateMatchStatusDto } from './dto/match-status.dto.ts';
import { RecommendationsService } from './recommendation.service.ts';

@Controller('admin/recommendations')
@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminRecommendationsController {
    constructor(private readonly recommendationsService: RecommendationsService) {}

    @Post('user-demands/:demandId/run')
    async runMatching(@Param('demandId') demandId: string) {
        const result = await this.recommendationsService.runMatchingForDemand(demandId);
        return ApiResponse.success(result);
    }

    @Get('user-demands/:demandId/matches')
    async findMatches(
        @Param('demandId') demandId: string,
        @Query() query: FilterDemandMatchesDto,
    ) {
        const result = await this.recommendationsService.findMatchesByDemand(demandId, query);
        return ApiResponse.success(result);
    }

    @Patch('matches/:matchId/status')
    async updateMatchStatus(
        @Param('matchId') matchId: string,
        @Body() dto: UpdateMatchStatusDto,
    ) {
        const result = await this.recommendationsService.updateMatchStatus(matchId, dto);
        return ApiResponse.success(result);
    }
}

@Controller('recommendations')
@UseGuards(TokenGuard)
export class RecommendationsController {
    constructor(private readonly recommendationsService: RecommendationsService) {}

    @Get('me')
    async getMyRecommendations(
        @CurrentUser() user: RequestUser,
        @Query() query: FilterDemandMatchesDto,
    ) {
        const result = await this.recommendationsService.findRecommendationsForUser(user.id, query);
        return ApiResponse.success(result);
    }

    @Post('matches/:matchId/feedback')
    async createFeedback(
        @CurrentUser() user: RequestUser,
        @Param('matchId') matchId: string,
        @Body() dto: CreateRecommendationFeedbackDto,
    ) {
        const result = await this.recommendationsService.createFeedback(user.id, matchId, dto);
        return ApiResponse.success(result);
    }

    @Post('me/recompute')
    async recomputeMine(@CurrentUser() user: RequestUser) {
        const result = await this.recommendationsService.recomputeForUser(user.id);
        return ApiResponse.success(result);
    }
}
