import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { CreateFavoriteDto } from './dto/create-favorite.dto.ts';
import { FavoritesService } from './favorites.service.ts';

@UseGuards(TokenGuard)
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) {}

    @Post()
    async add(@CurrentUser() user: RequestUser, @Body() dto: CreateFavoriteDto) {
        const result = await this.favoritesService.add(user.id, dto);
        return ApiResponse.success(result);
    }

    @Get()
    async findMine(@CurrentUser() user: RequestUser, @Query() query: PaginationQueryDto) {
        const result = await this.favoritesService.findMine(user.id, query);
        return ApiResponse.success(result);
    }

    @Get('check/:propertyId')
    async check(@CurrentUser() user: RequestUser, @Param('propertyId') propertyId: string) {
        const result = await this.favoritesService.check(user.id, propertyId);
        return ApiResponse.success(result);
    }

    @Delete(':propertyId')
    async remove(@CurrentUser() user: RequestUser, @Param('propertyId') propertyId: string) {
        const result = await this.favoritesService.remove(user.id, propertyId);
        return ApiResponse.success(result);
    }
}
