import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { DataSourcesService } from './data-sources.service.ts';
import { CreateDataSourceDto } from './dto/create-data-source.dto.ts';
import { FilterDataSourceDto } from './dto/filter-data-source.dto.ts';
import { UpdateDataSourceStatusDto } from './dto/update-data-source-status.dto.ts';
import { UpdateDataSourceDto } from './dto/update-data-source.dto.ts';

@Controller('admin/data-sources')
@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DataSourcesController {
    constructor(private readonly dataSourcesService: DataSourcesService) {}

    @Post()
    async create(@CurrentUser() user: RequestUser, @Body() dto: CreateDataSourceDto) {
        const result = await this.dataSourcesService.create(user.id, dto);
        return ApiResponse.success(result);
    }

    @Get()
    async findAll(@Query() query: FilterDataSourceDto) {
        const result = await this.dataSourcesService.findAll(query);
        return ApiResponse.success(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.dataSourcesService.findOne(id);
        return ApiResponse.success(result);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateDataSourceDto) {
        const result = await this.dataSourcesService.update(id, dto);
        return ApiResponse.success(result);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body() dto: UpdateDataSourceStatusDto) {
        const result = await this.dataSourcesService.updateStatus(id, dto);
        return ApiResponse.success(result);
    }
}
