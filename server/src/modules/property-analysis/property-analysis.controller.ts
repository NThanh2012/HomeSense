import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { PropertyAnalysisService } from './property-analysis.service.ts';

@Controller('property-analysis')
export class PropertyAnalysisController {
    constructor(private readonly propertyAnalysisService: PropertyAnalysisService) {}

    @Post('raw-posts/:rawPostId')
    @HttpCode(HttpStatus.OK)
    async analyzeRawPost(@Param('rawPostId') rawPostId: string) {
        const result = await this.propertyAnalysisService.analyzeRawPost(rawPostId);
        return ApiResponse.success(result);
    }
}
