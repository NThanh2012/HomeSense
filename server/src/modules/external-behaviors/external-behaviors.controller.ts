import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { CreateExternalUserLinkDto } from './dto/create-external-user-link.dto.ts';
import { FilterExternalBehaviorDto } from './dto/filter-external-behavior.dto.ts';
import { FilterExternalUserLinkDto } from './dto/filter-external-user-link.dto.ts';
import { UpdateExternalUserLinkStatusDto } from './dto/update-external-user-link-status.dto.ts';
import { ExternalBehaviorsService } from './external-behaviors.service.ts';
import { ExternalUserLinksService } from './external-user-links.service.ts';

@Controller('admin/external-behaviors')
@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ExternalBehaviorsController {
    constructor(private readonly externalBehaviorsService: ExternalBehaviorsService) {}

    @Get()
    async findAll(@Query() query: FilterExternalBehaviorDto) {
        return ApiResponse.success(await this.externalBehaviorsService.findAll(query));
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return ApiResponse.success(await this.externalBehaviorsService.findOne(id));
    }

    @Post(':id/retry')
    async retry(@Param('id') id: string) {
        return ApiResponse.success(await this.externalBehaviorsService.retry(id));
    }
}

@Controller('admin/external-user-links')
@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ExternalUserLinksController {
    constructor(private readonly externalUserLinksService: ExternalUserLinksService) {}

    @Post()
    async create(@CurrentUser() user: RequestUser, @Body() dto: CreateExternalUserLinkDto) {
        return ApiResponse.success(await this.externalUserLinksService.create(user.id, dto));
    }

    @Get()
    async findAll(@Query() query: FilterExternalUserLinkDto) {
        return ApiResponse.success(await this.externalUserLinksService.findAll(query));
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateExternalUserLinkStatusDto,
    ) {
        return ApiResponse.success(await this.externalUserLinksService.updateStatus(id, dto));
    }
}
