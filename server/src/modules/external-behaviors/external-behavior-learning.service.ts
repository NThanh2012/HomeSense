import { Injectable, Optional } from '@nestjs/common';
import {
    DemandType,
    ExternalBehaviorAnalysisStatus,
    LearningJobPriority,
    LearningJobStatus,
    LearningJobType,
    Prisma,
    PropertyType,
    TransactionType,
    UserBehaviorEventType,
    UserBehaviorSource,
    UserDemandOrigin,
    UserDemandStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { RecommendationsService } from '../recommendations/recommendation.service.ts';
import { ExternalBehaviorAnalyzer, ExternalBehaviorAnalyzerOutput } from './analyzers/external-behavior-analyzer.ts';
import { ExternalBehaviorsService } from './external-behaviors.service.ts';
import { ExternalUserLinksService } from './external-user-links.service.ts';
import { RawExternalBehaviorStatus } from './schemas/raw-external-behavior.schema.ts';
import { UserLearningService } from '../user-learning/user-learning.service.ts';

export type RecommendationRefreshStatus = 'UPDATED' | 'NO_NEW_DATA' | 'PARTIAL' | 'FAILED';

export interface RecommendationRefreshResult {
    status: RecommendationRefreshStatus;
    analyzedRecords: number;
    remainingRecords: number;
    matchedCount: number;
}

const EVENT_WEIGHTS: Partial<Record<UserBehaviorEventType, number>> = {
    [UserBehaviorEventType.PROPERTY_VIEW]: 1,
    [UserBehaviorEventType.SEARCH]: 2,
    [UserBehaviorEventType.PROPERTY_SAVE]: 4,
    [UserBehaviorEventType.INQUIRY_CREATED]: 6,
};

@Injectable()
export class ExternalBehaviorLearningService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly externalBehaviorsService: ExternalBehaviorsService,
        private readonly externalUserLinksService: ExternalUserLinksService,
        private readonly analyzer: ExternalBehaviorAnalyzer,
        private readonly recommendationsService: RecommendationsService,
        @Optional() private readonly userLearningService?: UserLearningService,
    ) {}

    async refreshForUser(userId: string): Promise<RecommendationRefreshResult> {
        const links = await this.externalUserLinksService.findActiveForUser(userId);
        if (links.length === 0) return this.emptyResult('NO_NEW_DATA');

        const maxRecords = this.readPositiveInteger('EXTERNAL_BEHAVIOR_LOGIN_MAX_RECORDS', 25);
        const maxBytes = this.readPositiveInteger('EXTERNAL_BEHAVIOR_LOGIN_MAX_BYTES', 65_536);
        const rawBehaviors = await this.externalBehaviorsService.findPendingBundle(
            links,
            maxRecords,
            maxBytes,
        );

        if (rawBehaviors.length === 0) return this.emptyResult('NO_NEW_DATA');

        let analyzedRecords = 0;
        let materializedEvents = 0;
        const providerAllowed = await this.hasDailyProviderBudget(userId);

        try {
            const analyzerResult = await this.analyzer.analyze(
                rawBehaviors.map((behavior) => ({
                    rawExternalBehaviorId: behavior.id,
                    occurredAt: behavior.occurredAt,
                    payload: behavior.payload,
                    providerAllowed,
                })),
            );
            const outputByRawId = new Map(
                analyzerResult.items.map((item) => [item.rawExternalBehaviorId, item]),
            );

            for (const rawBehavior of rawBehaviors) {
                const output = outputByRawId.get(rawBehavior.id);
                if (!output) {
                    await this.externalBehaviorsService.markStatus(
                        rawBehavior.id,
                        RawExternalBehaviorStatus.REVIEW_REQUIRED,
                        'Gemini không trả kết quả cho raw record',
                    );
                    continue;
                }

                const result = await this.materializeOutput(userId, rawBehavior, output, analyzerResult);
                analyzedRecords += 1;
                if (result.materialized) materializedEvents += 1;
            }
        } catch {
            await Promise.all(
                rawBehaviors.map((behavior) =>
                    this.externalBehaviorsService.markStatus(
                        behavior.id,
                        RawExternalBehaviorStatus.FAILED,
                        'Không thể phân tích external behavior bằng Gemini',
                    ),
                ),
            );
            return {
                status: 'FAILED',
                analyzedRecords: 0,
                remainingRecords: await this.externalBehaviorsService.countPending(links),
                matchedCount: 0,
            };
        }

        let matchedCount = 0;
        if (materializedEvents > 0) {
            await this.markPreferenceStale(userId);
            await this.upsertBehaviorDerivedDemands(userId);
            const recommendationResult = await this.recommendationsService.recomputeForUser(userId);
            matchedCount = recommendationResult.matchedCount;
        }

        const remainingRecords = await this.externalBehaviorsService.countPending(links);
        return {
            status: remainingRecords > 0 ? 'PARTIAL' : 'UPDATED',
            analyzedRecords: analyzedRecords,
            remainingRecords: remainingRecords,
            matchedCount: matchedCount,
        };
    }

    private async materializeOutput(
        userId: string,
        rawBehavior: Awaited<ReturnType<ExternalBehaviorsService['findPendingBundle']>>[number],
        output: ExternalBehaviorAnalyzerOutput,
        analyzerResult: {
            provider: string;
            model: string;
            promptVersion: string;
            estimatedInputTokens?: number;
            estimatedOutputTokens?: number;
            items: ExternalBehaviorAnalyzerOutput[];
        },
    ) {
        const eventType = this.mapEventType(output.eventType);
        const reviewRequired =
            !eventType ||
            output.confidence < 0.35 ||
            (output.demandType === 'UNKNOWN' &&
                output.propertyTypes.every((item) => item === 'UNKNOWN') &&
                !output.rawLocation &&
                output.keywords.length === 0);
        const analysisStatus = reviewRequired
            ? ExternalBehaviorAnalysisStatus.REVIEW_REQUIRED
            : ExternalBehaviorAnalysisStatus.ANALYZED;
        const analysis = await this.prisma.externalBehaviorAnalysis.upsert({
            where: { rawExternalBehaviorId: rawBehavior.id },
            create: {
                rawExternalBehaviorId: rawBehavior.id,
                dataSourceId: rawBehavior.dataSourceId,
                externalUserRef: rawBehavior.externalUserRef,
                status: analysisStatus,
                provider: analyzerResult.provider,
                model: analyzerResult.model,
                promptVersion: analyzerResult.promptVersion,
                eventType: eventType,
                demandType: this.mapDemandType(output.demandType),
                propertyTypes: this.mapPropertyTypes(output.propertyTypes),
                minPrice: this.numberOrNull(output.minPrice),
                maxPrice: this.numberOrNull(output.maxPrice),
                minArea: this.numberOrNull(output.minArea),
                maxArea: this.numberOrNull(output.maxArea),
                province: this.textOrNull(output.province),
                district: this.textOrNull(output.district),
                rawLocation: this.textOrNull(output.rawLocation),
                keywords: this.cleanKeywords(output.keywords),
                confidence: this.clamp(output.confidence, 0, 1),
                occurredAt: rawBehavior.occurredAt ? new Date(rawBehavior.occurredAt) : null,
                result: output as unknown as Prisma.InputJsonValue,
                errorMessage: reviewRequired ? output.reviewReason ?? 'Tín hiệu BĐS chưa đủ rõ' : null,
                estimatedInputTokens: this.tokensPerItem(analyzerResult.estimatedInputTokens, analyzerResult.items.length),
                estimatedOutputTokens: this.tokensPerItem(analyzerResult.estimatedOutputTokens, analyzerResult.items.length),
            },
            update: {
                status: analysisStatus,
                provider: analyzerResult.provider,
                model: analyzerResult.model,
                promptVersion: analyzerResult.promptVersion,
                eventType: eventType,
                demandType: this.mapDemandType(output.demandType),
                propertyTypes: this.mapPropertyTypes(output.propertyTypes),
                minPrice: this.numberOrNull(output.minPrice),
                maxPrice: this.numberOrNull(output.maxPrice),
                minArea: this.numberOrNull(output.minArea),
                maxArea: this.numberOrNull(output.maxArea),
                province: this.textOrNull(output.province),
                district: this.textOrNull(output.district),
                rawLocation: this.textOrNull(output.rawLocation),
                keywords: this.cleanKeywords(output.keywords),
                confidence: this.clamp(output.confidence, 0, 1),
                occurredAt: rawBehavior.occurredAt ? new Date(rawBehavior.occurredAt) : null,
                result: output as unknown as Prisma.InputJsonValue,
                errorMessage: reviewRequired ? output.reviewReason ?? 'Tín hiệu BĐS chưa đủ rõ' : null,
                estimatedInputTokens: this.tokensPerItem(analyzerResult.estimatedInputTokens, analyzerResult.items.length),
                estimatedOutputTokens: this.tokensPerItem(analyzerResult.estimatedOutputTokens, analyzerResult.items.length),
            },
        });

        if (reviewRequired || !eventType) {
            await this.externalBehaviorsService.markStatus(
                rawBehavior.id,
                RawExternalBehaviorStatus.REVIEW_REQUIRED,
                analysis.errorMessage ?? undefined,
            );
            return { materialized: false };
        }

        const behaviorEvent = await this.prisma.userBehaviorEvent.upsert({
            where: { externalBehaviorAnalysisId: analysis.id },
            create: {
                userId: userId,
                eventType: eventType,
                source: UserBehaviorSource.EXTERNAL,
                occurredAt: analysis.occurredAt,
                externalBehaviorAnalysisId: analysis.id,
                keyword: analysis.keywords[0],
                filters: this.buildPreferenceSnapshot(analysis),
                metadata: {
                    dataSourceId: rawBehavior.dataSourceId,
                    externalUserRef: rawBehavior.externalUserRef,
                    externalBehaviorAnalysisId: analysis.id,
                    demandType: analysis.demandType,
                    propertyTypes: analysis.propertyTypes,
                    keywords: analysis.keywords,
                },
                eventKey: `external:${analysis.id}`,
            },
            update: {
                userId: userId,
                eventType: eventType,
                source: UserBehaviorSource.EXTERNAL,
                occurredAt: analysis.occurredAt,
                keyword: analysis.keywords[0],
                filters: this.buildPreferenceSnapshot(analysis),
            },
        });
        await this.externalBehaviorsService.markStatus(
            rawBehavior.id,
            RawExternalBehaviorStatus.ANALYZED,
        );
        if (this.userLearningService) {
            await this.userLearningService.materializeBehaviorEvent(userId, behaviorEvent.id);
            try {
                await this.externalBehaviorsService.deleteAnalyzed(rawBehavior.id);
            } catch {
                await this.queueRawCleanup(rawBehavior.id);
            }
        }
        return { materialized: true };
    }

    private async upsertBehaviorDerivedDemands(userId: string) {
        const events = await this.prisma.userBehaviorEvent.findMany({
            where: {
                userId: userId,
                source: UserBehaviorSource.EXTERNAL,
                externalBehaviorAnalysisId: { not: null },
            },
            include: {
                externalBehaviorAnalysis: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });

        for (const demandType of [DemandType.BUY, DemandType.RENT]) {
            const matchingEvents = events.filter(
                (event) => event.externalBehaviorAnalysis?.demandType === demandType,
            );
            if (matchingEvents.length === 0) continue;

            const aggregate = this.aggregateDemand(matchingEvents);
            await this.prisma.userDemand.upsert({
                where: { behaviorDerivedKey: `${userId}:${demandType}` },
                create: {
                    userId: userId,
                    behaviorDerivedKey: `${userId}:${demandType}`,
                    origin: UserDemandOrigin.EXTERNAL_BEHAVIOR,
                    demandType: demandType,
                    status: UserDemandStatus.ANALYZED,
                    ...aggregate,
                },
                update: {
                    demandType: demandType,
                    status: UserDemandStatus.ANALYZED,
                    ...aggregate,
                },
            });
        }
    }

    private aggregateDemand(events: any[]) {
        const propertyTypeScores = new Map<PropertyType, number>();
        const locationScores = new Map<string, { score: number; province: string | null; district: string | null }>();
        const keywordScores = new Map<string, number>();
        const prices: number[] = [];
        const areas: number[] = [];
        let weightedConfidence = 0;
        let totalWeight = 0;

        for (const event of events) {
            const analysis = event.externalBehaviorAnalysis;
            const weight = EVENT_WEIGHTS[event.eventType] ?? 1;
            totalWeight += weight;
            weightedConfidence += Number(analysis.confidence ?? 0) * weight;

            for (const type of analysis.propertyTypes ?? []) {
                if (type !== PropertyType.UNKNOWN) {
                    propertyTypeScores.set(type, (propertyTypeScores.get(type) ?? 0) + weight);
                }
            }
            const locationKey = [analysis.district, analysis.province].filter(Boolean).join(', ');
            if (locationKey) {
                const existing = locationScores.get(locationKey);
                locationScores.set(locationKey, {
                    score: (existing?.score ?? 0) + weight,
                    province: analysis.province,
                    district: analysis.district,
                });
            }
            for (const keyword of analysis.keywords ?? []) {
                const normalized = keyword.trim().toLowerCase();
                if (normalized) keywordScores.set(normalized, (keywordScores.get(normalized) ?? 0) + weight);
            }
            this.addWeightedNumber(prices, analysis.minPrice, weight);
            this.addWeightedNumber(prices, analysis.maxPrice, weight);
            this.addWeightedNumber(areas, analysis.minArea, weight);
            this.addWeightedNumber(areas, analysis.maxArea, weight);
        }

        const topLocation = Array.from(locationScores.values()).sort((a, b) => b.score - a.score)[0];
        return {
            propertyTypes: Array.from(propertyTypeScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([type]) => type),
            minPrice: this.percentile(prices, 0.2),
            maxPrice: this.percentile(prices, 0.8),
            minArea: this.percentile(areas, 0.2),
            maxArea: this.percentile(areas, 0.8),
            province: topLocation?.province ?? null,
            district: topLocation?.district ?? null,
            rawLocation: topLocation ? [topLocation.district, topLocation.province].filter(Boolean).join(', ') : null,
            keywords: Array.from(keywordScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([keyword]) => keyword),
            sourceConfidence: totalWeight > 0 ? Number((weightedConfidence / totalWeight).toFixed(4)) : 0,
        };
    }

    private buildPreferenceSnapshot(analysis: any): Prisma.InputJsonValue {
        return {
            transactionType:
                analysis.demandType === DemandType.BUY
                    ? TransactionType.SELL
                    : analysis.demandType === DemandType.RENT
                      ? TransactionType.RENT
                      : TransactionType.UNKNOWN,
            propertyType:
                analysis.propertyTypes.find((type: PropertyType) => type !== PropertyType.UNKNOWN) ??
                PropertyType.UNKNOWN,
            minPrice: analysis.minPrice === null ? null : Number(analysis.minPrice),
            maxPrice: analysis.maxPrice === null ? null : Number(analysis.maxPrice),
            minArea: analysis.minArea,
            maxArea: analysis.maxArea,
            province: analysis.province,
            district: analysis.district,
            keyword: analysis.keywords[0] ?? null,
        } as Prisma.InputJsonValue;
    }

    private markPreferenceStale(userId: string) {
        return this.prisma.userPreferenceProfile.updateMany({
            where: { userId: userId },
            data: { isStale: true },
        });
    }

    private mapEventType(eventType: ExternalBehaviorAnalyzerOutput['eventType']) {
        const map: Partial<Record<ExternalBehaviorAnalyzerOutput['eventType'], UserBehaviorEventType>> = {
            VIEW: UserBehaviorEventType.PROPERTY_VIEW,
            SAVE: UserBehaviorEventType.PROPERTY_SAVE,
            SEARCH: UserBehaviorEventType.SEARCH,
            CONTACT: UserBehaviorEventType.INQUIRY_CREATED,
        };
        return map[eventType] ?? null;
    }

    private mapDemandType(demandType: ExternalBehaviorAnalyzerOutput['demandType']) {
        if (demandType === 'BUY') return DemandType.BUY;
        if (demandType === 'RENT') return DemandType.RENT;
        return DemandType.UNKNOWN;
    }

    private mapPropertyTypes(types: ExternalBehaviorAnalyzerOutput['propertyTypes']) {
        return Array.from(
            new Set(
                types.map((type) =>
                    Object.values(PropertyType).includes(type as PropertyType)
                        ? (type as PropertyType)
                        : PropertyType.UNKNOWN,
                ),
            ),
        );
    }

    private cleanKeywords(keywords: string[]) {
        return Array.from(new Set(keywords.map((item) => item.trim()).filter(Boolean))).slice(0, 20);
    }

    private textOrNull(value: string | null) {
        return value?.trim() || null;
    }

    private numberOrNull(value: number | null) {
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
    }

    private addWeightedNumber(target: number[], value: unknown, weight: number) {
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) return;
        for (let index = 0; index < Math.max(1, Math.round(weight)); index += 1) target.push(number);
    }

    private percentile(values: number[], ratio: number) {
        if (values.length === 0) return null;
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))];
    }

    private readPositiveInteger(name: string, fallback: number) {
        const value = Number(process.env[name]);
        return Number.isInteger(value) && value > 0 ? value : fallback;
    }

    private clamp(value: number, min: number, max: number) {
        return Math.min(max, Math.max(min, value));
    }

    private emptyResult(status: RecommendationRefreshStatus): RecommendationRefreshResult {
        return { status: status, analyzedRecords: 0, remainingRecords: 0, matchedCount: 0 };
    }

    private queueRawCleanup(rawRecordId: string) {
        return this.prisma.learningJob.upsert({
            where: { activeKey: `RAW_CLEANUP:${rawRecordId}` },
            create: {
                type: LearningJobType.RAW_CLEANUP,
                status: LearningJobStatus.PENDING,
                priority: LearningJobPriority.NORMAL,
                activeKey: `RAW_CLEANUP:${rawRecordId}`,
                payload: { rawRecordId },
            },
            update: {
                status: LearningJobStatus.PENDING,
                availableAt: new Date(),
                lastError: null,
            },
        });
    }

    private async hasDailyProviderBudget(userId: string) {
        if (!this.prisma.externalBehaviorAnalysis?.count || !this.prisma.externalBehaviorAnalysis?.aggregate) {
            return true;
        }
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const where = {
            provider: { contains: 'gemini', mode: 'insensitive' as const },
            createdAt: { gte: startOfDay },
            behaviorEvent: { is: { userId } },
        };
        const [requests, tokens] = await Promise.all([
            this.prisma.externalBehaviorAnalysis.count({ where }),
            this.prisma.externalBehaviorAnalysis.aggregate({
                where,
                _sum: { estimatedInputTokens: true, estimatedOutputTokens: true },
            }),
        ]);
        const tokenTotal =
            Number(tokens._sum.estimatedInputTokens ?? 0) + Number(tokens._sum.estimatedOutputTokens ?? 0);
        return (
            requests < this.readPositiveInteger('GEMINI_DAILY_MAX_REQUESTS_PER_USER', 50) &&
            tokenTotal < this.readPositiveInteger('GEMINI_DAILY_MAX_TOKENS_PER_USER', 100_000)
        );
    }

    private tokensPerItem(total: number | undefined, itemCount: number) {
        return total && itemCount > 0 ? Math.ceil(total / itemCount) : 0;
    }
}
