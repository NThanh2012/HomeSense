import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import type { RequestUser } from '../../common/types/request-user.type.ts';
import { CreateInquiryDto } from './dto/create-inquiry.dto.ts';
import { InquiriesService } from './inquiries.service.ts';

@UseGuards(TokenGuard)
@Controller('inquiries')
export class InquiriesController {
    constructor(private readonly inquiriesService: InquiriesService) {}

    @Post()
    async create(@CurrentUser() user: RequestUser, @Body() dto: CreateInquiryDto) {
        const result = await this.inquiriesService.create(user.id, dto);
        return ApiResponse.success(result);
    }

    @Get('me')
    async findMine(@CurrentUser() user: RequestUser, @Query() query: PaginationQueryDto) {
        const result = await this.inquiriesService.findMine(user.id, query);
        return ApiResponse.success(result);
    }

    @Get(':id')
    async findOneMine(@CurrentUser() user: RequestUser, @Param('id') id: string) {
        const result = await this.inquiriesService.findOneMine(user.id, id);
        return ApiResponse.success(result);
    }
}
