import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { FilterLearningJobDto } from './dto/filter-learning-job.dto.ts';
import { LearningJobsService } from './learning-jobs.service.ts';

@Controller('admin/learning-jobs')
@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LearningJobsController {
    constructor(private readonly service: LearningJobsService) {}

    @Get()
    async findAll(@Query() query: FilterLearningJobDto) {
        return ApiResponse.success(await this.service.findAll(query));
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return ApiResponse.success(await this.service.findOne(id));
    }

    @Post(':id/retry')
    async retry(@Param('id') id: string) {
        return ApiResponse.success(await this.service.retry(id));
    }
}

@Controller('admin/users')
@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserLearningJobsController {
    constructor(private readonly service: LearningJobsService) {}

    @Post(':userId/learning/run')
    async run(@Param('userId') userId: string) {
        return ApiResponse.success(await this.service.runForUser(userId));
    }
}
