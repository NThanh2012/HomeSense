import { Injectable, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import {
    LearningJobPriority,
    LearningJobStatus,
    LearningJobType,
    Prisma,
} from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { ExternalBehaviorLearningService } from '../external-behaviors/external-behavior-learning.service.ts';
import { ExternalBehaviorsService } from '../external-behaviors/external-behaviors.service.ts';
import { RecommendationsService } from '../recommendations/recommendation.service.ts';
import { FilterLearningJobDto } from './dto/filter-learning-job.dto.ts';

export interface QueueLearningJobOptions {
    priority?: LearningJobPriority;
    reason?: string;
    availableAt?: Date;
    payload?: Prisma.InputJsonValue;
}

@Injectable()
export class LearningJobsService implements OnModuleInit, OnModuleDestroy {
    private timer?: NodeJS.Timeout;
    private running = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly externalLearningService: ExternalBehaviorLearningService,
        private readonly recommendationsService: RecommendationsService,
        @Optional() private readonly externalBehaviorsService?: ExternalBehaviorsService,
    ) {}

    onModuleInit() {
        if (process.env.LEARNING_JOB_WORKER_ENABLED === 'false') return;
        const intervalMs = this.readPositiveInteger('LEARNING_JOB_POLL_INTERVAL_MS', 5_000);
        this.timer = setInterval(() => void this.runAvailableJobs(), intervalMs);
        this.timer.unref();
        void this.runAvailableJobs();
    }

    onModuleDestroy() {
        if (this.timer) clearInterval(this.timer);
    }

    async enqueueForUser(userId: string, type: LearningJobType, options: QueueLearningJobOptions = {}) {
        const activeKey = `${type}:${userId}`;
        const existing = await this.prisma.learningJob.findUnique({ where: { activeKey } });
        const job =
            existing?.status === LearningJobStatus.PROCESSING
                ? await this.prisma.learningJob.update({
                      where: { id: existing.id },
                      data: {
                          priority: options.priority ?? existing.priority,
                          payload: this.rerunPayload(options.payload),
                      },
                  })
                : await this.prisma.learningJob.upsert({
                      where: { activeKey },
                      create: {
                          userId,
                          type,
                          activeKey,
                          status: LearningJobStatus.PENDING,
                          priority: options.priority ?? LearningJobPriority.NORMAL,
                          availableAt: options.availableAt ?? new Date(),
                          payload: options.payload,
                      },
                      update: {
                          status: LearningJobStatus.PENDING,
                          priority: options.priority ?? LearningJobPriority.NORMAL,
                          availableAt: options.availableAt ?? new Date(),
                          leaseExpiresAt: null,
                          lastError: null,
                          finishedAt: null,
                          payload: options.payload,
                      },
                  });

        if (type === LearningJobType.RECOMMENDATION_RECOMPUTE) {
            await this.prisma.recommendationRecomputeJob.upsert({
                where: { learningJobId: job.id },
                create: {
                    learningJobId: job.id,
                    userId,
                    reason: options.reason ?? 'behavior_changed',
                },
                update: {
                    reason: options.reason ?? 'behavior_changed',
                },
            });
        }
        return job;
    }

    async queueOnLogin(userId: string) {
        const [existingRecommendations, activeJob] = await Promise.all([
            this.prisma.demandPropertyMatch.count({
                where: {
                    demand: { userId },
                    status: 'ACTIVE',
                    property: {
                        status: 'PUBLISHED',
                        createdByUserId: { not: null },
                    },
                },
            }),
            this.prisma.learningJob.findFirst({
                where: {
                    userId,
                    type: { in: [LearningJobType.EXTERNAL_LEARNING, LearningJobType.RECOMMENDATION_RECOMPUTE] },
                    status: { in: [LearningJobStatus.PENDING, LearningJobStatus.PROCESSING] },
                },
                orderBy: { priority: 'desc' },
            }),
        ]);

        const job =
            activeJob ??
            (await this.enqueueForUser(userId, LearningJobType.EXTERNAL_LEARNING, {
                priority: existingRecommendations === 0 ? LearningJobPriority.IMMEDIATE : LearningJobPriority.HIGH,
                reason: 'login_refresh',
            }));
        if (existingRecommendations === 0) {
            await this.enqueueForUser(userId, LearningJobType.RECOMMENDATION_RECOMPUTE, {
                priority: LearningJobPriority.IMMEDIATE,
                reason: 'login_cold_start',
            });
        }
        return {
            status: job.status === LearningJobStatus.PROCESSING ? 'PROCESSING' : 'QUEUED',
            jobId: job.id,
            hasExistingRecommendations: existingRecommendations > 0,
        };
    }

    async runForUser(userId: string) {
        return this.enqueueForUser(userId, LearningJobType.EXTERNAL_LEARNING, {
            priority: LearningJobPriority.IMMEDIATE,
            reason: 'admin_run_now',
        });
    }

    async findAll(query: FilterLearningJobDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where: Prisma.LearningJobWhereInput = {
            ...(query.type ? { type: query.type } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.userId ? { userId: query.userId } : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.learningJob.findMany({
                where,
                include: { recommendationRecompute: true, _count: { select: { items: true } } },
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.learningJob.count({ where }),
        ]);
        return buildPaginatedResult(items, page, limit, total);
    }

    async findOne(id: string) {
        const job = await this.prisma.learningJob.findUnique({
            where: { id },
            include: { items: true, recommendationRecompute: true },
        });
        if (!job) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy learning job');
        }
        return job;
    }

    async retry(id: string) {
        const job = await this.findOne(id);
        const activeKey = `${job.type}:${job.userId ?? job.id}`;
        const existingActive = await this.prisma.learningJob.findUnique({ where: { activeKey } });
        if (existingActive && existingActive.id !== job.id) {
            return existingActive;
        }
        return this.prisma.learningJob.update({
            where: { id: job.id },
            data: {
                status: LearningJobStatus.PENDING,
                activeKey,
                priority: LearningJobPriority.IMMEDIATE,
                availableAt: new Date(),
                leaseExpiresAt: null,
                lastError: null,
                finishedAt: null,
            },
        });
    }

    async runAvailableJobs(limit = 5) {
        if (this.running) return;
        this.running = true;
        try {
            for (let index = 0; index < limit; index += 1) {
                const job = await this.claimNext();
                if (!job) break;
                await this.process(job);
            }
        } finally {
            this.running = false;
        }
    }

    async claimNext() {
        const now = new Date();
        const leaseExpiresAt = new Date(now.getTime() + this.readPositiveInteger('LEARNING_JOB_LEASE_MS', 60_000));
        return this.prisma.$transaction(async (tx) => {
            await tx.learningJob.updateMany({
                where: {
                    status: LearningJobStatus.PROCESSING,
                    leaseExpiresAt: { lt: now },
                    attempts: { lt: 3 },
                },
                data: {
                    status: LearningJobStatus.PENDING,
                    availableAt: now,
                    leaseExpiresAt: null,
                },
            });
            const candidate = await tx.learningJob.findFirst({
                where: {
                    status: LearningJobStatus.PENDING,
                    availableAt: { lte: now },
                    attempts: { lt: 3 },
                },
                orderBy: [{ priority: 'desc' }, { availableAt: 'asc' }, { createdAt: 'asc' }],
            });
            if (!candidate) return null;
            const claimed = await tx.learningJob.updateMany({
                where: { id: candidate.id, status: LearningJobStatus.PENDING },
                data: {
                    status: LearningJobStatus.PROCESSING,
                    leaseExpiresAt,
                    startedAt: now,
                    attempts: { increment: 1 },
                },
            });
            return claimed.count === 1
                ? tx.learningJob.findUnique({ where: { id: candidate.id } })
                : null;
        });
    }

    private async process(job: NonNullable<Awaited<ReturnType<LearningJobsService['claimNext']>>>) {
        try {
            let result: unknown = {};
            if (job.type === LearningJobType.EXTERNAL_LEARNING && job.userId) {
                result = await this.externalLearningService.refreshForUser(job.userId);
            } else if (job.type === LearningJobType.RECOMMENDATION_RECOMPUTE && job.userId) {
                result = await this.recommendationsService.recomputeForUser(job.userId);
            } else if (job.type === LearningJobType.RAW_CLEANUP && this.externalBehaviorsService) {
                const rawRecordId = this.payloadText(job.payload, 'rawRecordId');
                if (rawRecordId) await this.externalBehaviorsService.deleteAnalyzed(rawRecordId);
                result = { rawRecordId, cleaned: Boolean(rawRecordId) };
            }
            const current = await this.prisma.learningJob.findUnique({ where: { id: job.id } });
            const rerunRequested = this.hasRerunRequest(current?.payload);
            await this.prisma.learningJob.update({
                where: { id: job.id },
                data: {
                    status: rerunRequested ? LearningJobStatus.PENDING : LearningJobStatus.COMPLETED,
                    activeKey: rerunRequested ? job.activeKey : null,
                    result: result as Prisma.InputJsonValue,
                    leaseExpiresAt: null,
                    availableAt: new Date(),
                    attempts: rerunRequested ? 0 : job.attempts,
                    payload: rerunRequested ? Prisma.JsonNull : undefined,
                    finishedAt: rerunRequested ? null : new Date(),
                },
            });
        } catch (error) {
            const retry = job.attempts < job.maxAttempts;
            await this.prisma.learningJob.update({
                where: { id: job.id },
                data: {
                    status: retry ? LearningJobStatus.PENDING : LearningJobStatus.FAILED,
                    activeKey: retry ? job.activeKey : null,
                    availableAt: new Date(Date.now() + Math.min(job.attempts, 3) * 30_000),
                    leaseExpiresAt: null,
                    lastError: error instanceof Error ? error.message.slice(0, 1000) : 'Learning job failed',
                    finishedAt: retry ? null : new Date(),
                },
            });
        }
    }

    private readPositiveInteger(name: string, fallback: number) {
        const value = Number(process.env[name]);
        return Number.isInteger(value) && value > 0 ? value : fallback;
    }

    private rerunPayload(payload?: Prisma.InputJsonValue): Prisma.InputJsonValue {
        return {
            rerunRequested: true,
            requestedPayload: payload ?? null,
        };
    }

    private hasRerunRequest(payload: unknown) {
        return Boolean(
            payload &&
                typeof payload === 'object' &&
                !Array.isArray(payload) &&
                (payload as Record<string, unknown>).rerunRequested,
        );
    }

    private payloadText(payload: unknown, key: string) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
        const value = (payload as Record<string, unknown>)[key];
        return typeof value === 'string' && value.trim() ? value.trim() : null;
    }
}
