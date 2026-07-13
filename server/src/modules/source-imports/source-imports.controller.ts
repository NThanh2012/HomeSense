import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { FilterSourceImportDto } from './dto/filter-source-import.dto.ts';
import { ImportJsonDto } from './dto/import-json.dto.ts';
import { SourceImportsService } from './source-imports.service.ts';

@Controller('admin/source-imports')
@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SourceImportsController {
    constructor(private readonly sourceImportsService: SourceImportsService) {}

    @Post('json')
    async importJson(@CurrentUser() user: RequestUser, @Body() dto: ImportJsonDto) {
        const result = await this.sourceImportsService.importJson(user.id, dto);
        return ApiResponse.success(result);
    }

    @Get()
    async findAll(@Query() query: FilterSourceImportDto) {
        const result = await this.sourceImportsService.findAll(query);
        return ApiResponse.success(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.sourceImportsService.findOne(id);
        return ApiResponse.success(result);
    }
}
