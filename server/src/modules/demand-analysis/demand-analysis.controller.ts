import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.ts';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { DemandAnalysisService } from './demand-analysis.service.ts';

@UseGuards(TokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/demand-analysis')
export class DemandAnalysisController {
    constructor(private readonly demandAnalysisService: DemandAnalysisService) {}

    @Post('user-signals/:signalId')
    async analyzeUserSignal(@Param('signalId') signalId: string) {
        const result = await this.demandAnalysisService.analyzeUserSignal(signalId);
        return ApiResponse.success(result);
    }
}
