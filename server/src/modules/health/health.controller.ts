import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '../../common/dto/api-response.dto.ts';
import { HealthService } from './health.service.ts';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    async check() {
        const result = await this.healthService.check();
        return ApiResponse.success(result);
    }
}
