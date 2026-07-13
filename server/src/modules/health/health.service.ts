import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PrismaService } from '../../database/prisma/prisma.service.ts';

@Injectable()
export class HealthService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectConnection() private readonly mongoConnection: Connection,
    ) {}

    async check() {
        let postgres = 'down';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            postgres = 'ok';
        } catch {
            postgres = 'down';
        }
        const mongo = this.mongoConnection.readyState === 1 ? 'ok' : 'down';
        const jobRunner = process.env.LEARNING_JOB_WORKER_ENABLED === 'false' ? 'disabled' : 'enabled';
        return {
            status: postgres === 'ok' && mongo === 'ok' ? 'ok' : 'degraded',
            service: 'support-bds-api',
            environment: process.env.NODE_ENV ?? 'development',
            checks: {
                postgres,
                mongo,
                jobRunner,
                geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
            },
            timestamp: new Date().toISOString(),
        };
    }
}
