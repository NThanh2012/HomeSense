import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.ts';
import { HealthService } from './health.service.ts';

@Module({
    imports: [],
    controllers: [HealthController],
    providers: [HealthService],
    exports: [HealthService],
})
export class HealthModule {}
