import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { CreateUserBehaviorDto } from './dto/create-user-behavior.dto.ts';
import { FilterUserBehaviorDto } from './dto/filter-user-behavior.dto.ts';
import { UserBehaviorsService } from './user-behaviors.service.ts';

@UseGuards(TokenGuard)
@Controller('user-behaviors')
export class UserBehaviorsController {
    constructor(private readonly userBehaviorsService: UserBehaviorsService) {}

    @Post()
    async create(@CurrentUser() user: RequestUser, @Body() dto: CreateUserBehaviorDto) {
        const result = await this.userBehaviorsService.create(user.id, dto);
        return ApiResponse.success(result);
    }

    @Get('me')
    async findMine(@CurrentUser() user: RequestUser, @Query() query: FilterUserBehaviorDto) {
        const result = await this.userBehaviorsService.findMine(user.id, query);
        return ApiResponse.success(result);
    }
}
