import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { FilterUserDemandDto } from './dto/filter-user-demand.dto.ts';
import { UpdateUserDemandStatusDto } from './dto/update-user-demand-status.dto.ts';
import { UserDemandsService } from './user-demands.service.ts';

@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/user-demands')
export class UserDemandsController {
    constructor(private readonly userDemandsService: UserDemandsService) {}

    @Get()
    async findAll(@Query() query: FilterUserDemandDto) {
        const result = await this.userDemandsService.findAll(query);
        return ApiResponse.success(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.userDemandsService.findOne(id);
        return ApiResponse.success(result);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body() dto: UpdateUserDemandStatusDto) {
        const result = await this.userDemandsService.updateStatus(id, dto);
        return ApiResponse.success(result);
    }
}
