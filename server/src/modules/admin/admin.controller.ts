import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { AdminService } from './admin.service.ts';
import { AdminFilterInquiriesDto } from './dto/admin-filter-inquiries.dto.ts';
import { AdminFilterPropertiesDto } from './dto/admin-filter-properties.dto.ts';
import { AdminFilterUsersDto } from './dto/admin-filter-users.dto.ts';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto.ts';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto.ts';

@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('overview')
    async getOverview() {
        const result = await this.adminService.getOverview();
        return ApiResponse.success(result);
    }

    @Get('users')
    async findUsers(@Query() query: AdminFilterUsersDto) {
        const result = await this.adminService.findUsers(query);
        return ApiResponse.success(result);
    }

    @Get('properties')
    async findProperties(@Query() query: AdminFilterPropertiesDto) {
        const result = await this.adminService.findProperties(query);
        return ApiResponse.success(result);
    }

    @Get('properties/:id')
    async findProperty(@Param('id') id: string) {
        const result = await this.adminService.findProperty(id);
        return ApiResponse.success(result);
    }

    @Patch('properties/:id/status')
    async updatePropertyStatus(
        @Param('id') id: string,
        @Body() dto: UpdatePropertyStatusDto,
    ) {
        const result = await this.adminService.updatePropertyStatus(id, dto);
        return ApiResponse.success(result);
    }

    @Get('inquiries')
    async findInquiries(@Query() query: AdminFilterInquiriesDto) {
        const result = await this.adminService.findInquiries(query);
        return ApiResponse.success(result);
    }

    @Get('inquiries/:id')
    async findInquiry(@Param('id') id: string) {
        const result = await this.adminService.findInquiry(id);
        return ApiResponse.success(result);
    }

    @Patch('inquiries/:id/status')
    async updateInquiryStatus(@Param('id') id: string, @Body() dto: UpdateInquiryStatusDto) {
        const result = await this.adminService.updateInquiryStatus(id, dto);
        return ApiResponse.success(result);
    }
}
