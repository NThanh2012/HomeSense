import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { CreatePropertyDto } from './dto/create-property.dto.ts';
import { FilterPropertyDto } from './dto/filter-property.dto.ts';
import { UpdateMyPropertyDto } from './dto/update-my-property.dto.ts';
import { PropertiesService } from './properties.service.ts';

@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) {}

    @Get()
    async findAll(@Query() query: FilterPropertyDto) {
        const result = await this.propertiesService.findAll(query);
        return ApiResponse.success(result);
    }

    @UseGuards(TokenGuard)
    @Post('me')
    async createMine(@CurrentUser() user: RequestUser, @Body() dto: CreatePropertyDto) {
        const result = await this.propertiesService.createMine(user.id, dto);
        return ApiResponse.success(result);
    }

    @UseGuards(TokenGuard)
    @Get('me')
    async findMine(@CurrentUser() user: RequestUser, @Query() query: PaginationQueryDto) {
        const result = await this.propertiesService.findMine(user.id, query);
        return ApiResponse.success(result);
    }

    @UseGuards(TokenGuard)
    @Get('me/:id')
    async findOneMine(@CurrentUser() user: RequestUser, @Param('id') id: string) {
        const result = await this.propertiesService.findOneMine(user.id, id);
        return ApiResponse.success(result);
    }

    @UseGuards(TokenGuard)
    @Patch('me/:id/submit')
    async submitMine(@CurrentUser() user: RequestUser, @Param('id') id: string) {
        const result = await this.propertiesService.submitMine(user.id, id);
        return ApiResponse.success(result);
    }

    @UseGuards(TokenGuard)
    @Patch('me/:id')
    async updateMine(
        @CurrentUser() user: RequestUser,
        @Param('id') id: string,
        @Body() dto: UpdateMyPropertyDto,
    ) {
        const result = await this.propertiesService.updateMine(user.id, id, dto);
        return ApiResponse.success(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.propertiesService.findOne(id);
        return ApiResponse.success(result);
    }
}
