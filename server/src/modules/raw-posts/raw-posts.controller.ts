import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { CreateRawPostDto } from './dto/create-raw-post.dto.ts';
import { RawPostsService } from './raw-posts.service.ts';

@Controller('raw-posts')
export class RawPostsController {
    constructor(private readonly rawPostsService: RawPostsService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    async create(@Body() dto: CreateRawPostDto) {
        const result = await this.rawPostsService.create(dto);
        return ApiResponse.success(result);
    }

    @Get()
    async findAll(@Query() query: PaginationQueryDto) {
        const result = await this.rawPostsService.findAll(query);
        return ApiResponse.success(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.rawPostsService.findOne(id);
        return ApiResponse.success(result);
    }
}
