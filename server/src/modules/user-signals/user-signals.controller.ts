import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { CreateUserSignalDto } from './dto/create-user-signal.dto.ts';
import { FilterUserSignalDto } from './dto/filter-user-signal.dto.ts';
import { UserSignalsService } from './user-signals.service.ts';

@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/user-signals')
export class UserSignalsController {
    constructor(private readonly userSignalsService: UserSignalsService) {}

    @Post()
    async create(@Body() dto: CreateUserSignalDto) {
        const result = await this.userSignalsService.createOrUpdateBySource(dto);
        return ApiResponse.success(result);
    }

    @Get()
    async findAll(@Query() query: FilterUserSignalDto) {
        const result = await this.userSignalsService.findAll(query);
        return ApiResponse.success(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.userSignalsService.findDetail(id);
        return ApiResponse.success(result);
    }
}
