import { Injectable } from '@nestjs/common';
import {
    DemandType,
    LearningJobPriority,
    LearningJobStatus,
    LearningJobType,
    PreferenceSignalSource,
    PreferenceSignalType,
    Prisma,
    PropertyType,
    RealEstateIntentStatus,
    TransactionType,
    UserBehaviorSource,
    UserDemandOrigin,
    UserDemandStatus,
} from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import {
    buildCanonicalSignals,
    buildIntentKey,
    calculateEffectiveSignalWeight,
} from '../../shared/utils/preference-signal.util.ts';
import { UpdateIntentStatusDto } from './dto/update-intent-status.dto.ts';
import { UpdateRealEstateContextDto } from './dto/update-real-estate-context.dto.ts';

@Injectable()
export class UserLearningService {
    constructor(private readonly prisma: PrismaService) {}

    async materializeBehaviorEvent(userId: string, eventId: string) {
        const event = await this.prisma.userBehaviorEvent.findFirst({
            where: { id: eventId, userId },
            include: {
                property: { include: { location: true } },
                match: { include: { property: { include: { location: true } } } },
            },
        });
        if (!event) return { signalCount: 0, intentCount: 0 };

        const property = event.property ?? event.match?.property ?? null;
        const drafts = buildCanonicalSignals({
            eventType: event.eventType,
            keyword: event.keyword,
            filters: this.objectOrNull(event.filters),
            metadata: this.objectOrNull(event.metadata),
            property: property
                ? {
                      transactionType: property.transactionType,
                      propertyType: property.propertyType,
                      price: property.price === null ? null : Number(property.price),
                      area: property.area,
                      bedrooms: property.bedrooms,
                      bathrooms: property.bathrooms,
                      furnishingStatus: property.furnishingStatus,
                      legalStatus: property.legalStatus,
                      direction: property.direction,
                      amenities: property.amenities,
                      location: property.location,
                  }
                : null,
        });
        const occurredAt = event.occurredAt ?? event.createdAt;
        const source =
            event.source === UserBehaviorSource.EXTERNAL
                ? PreferenceSignalSource.EXTERNAL_BEHAVIOR
                : PreferenceSignalSource.WEBSITE_BEHAVIOR;

        for (const [index, draft] of drafts.entries()) {
            const provenanceKey = `event:${event.id}:${draft.signalType}:${index}`;
            await this.prisma.userPreferenceSignal.upsert({
                where: { provenanceKey },
                create: {
                    userId,
                    signalType: draft.signalType,
                    source,
                    value: draft.value as Prisma.InputJsonValue,
                    baseWeight: draft.baseWeight,
                    occurredAt,
                    provenanceKey,
                    behaviorEventId: event.id,
                    externalBehaviorAnalysisId: event.externalBehaviorAnalysisId,
                },
                update: {
                    value: draft.value as Prisma.InputJsonValue,
                    baseWeight: draft.baseWeight,
                    occurredAt,
                },
            });
        }

        const intents = drafts.length > 0 ? await this.recomputeIntents(userId) : [];
        if (drafts.length > 0) {
            await this.queueRecommendationRecompute(userId, event.eventType);
        }
        return { signalCount: drafts.length, intentCount: intents.length };
    }

    async recomputeIntents(userId: string) {
        const signals = await this.prisma.userPreferenceSignal.findMany({
            where: { userId },
            orderBy: { occurredAt: 'desc' },
            take: 1000,
        });
        const grouped = new Map<string, typeof signals>();
        for (const signal of signals) {
            const key = buildIntentKey(signal.value);
            grouped.set(key, [...(grouped.get(key) ?? []), signal]);
        }

        const results: Array<{ id: string }> = [];
        for (const [intentKey, group] of grouped.entries()) {
            const snapshot = this.buildIntentSnapshot(group);
            const demand = await this.prisma.userDemand.upsert({
                where: { behaviorDerivedKey: `intent:${userId}:${intentKey}` },
                create: {
                    userId,
                    behaviorDerivedKey: `intent:${userId}:${intentKey}`,
                    origin: snapshot.hasExternalOnly
                        ? UserDemandOrigin.EXTERNAL_BEHAVIOR
                        : UserDemandOrigin.EXPLICIT,
                    demandType: snapshot.demandType,
                    propertyTypes: snapshot.propertyTypes,
                    province: snapshot.province,
                    district: snapshot.district,
                    rawLocation: snapshot.rawLocation,
                    keywords: snapshot.keywords,
                    sourceConfidence: snapshot.confidence,
                    status: UserDemandStatus.ANALYZED,
                },
                update: {
                    demandType: snapshot.demandType,
                    propertyTypes: snapshot.propertyTypes,
                    province: snapshot.province,
                    district: snapshot.district,
                    rawLocation: snapshot.rawLocation,
                    keywords: snapshot.keywords,
                    sourceConfidence: snapshot.confidence,
                    status: UserDemandStatus.ANALYZED,
                },
            });
            const intent = await this.prisma.userRealEstateIntent.upsert({
                where: { userId_intentKey: { userId, intentKey } },
                create: {
                    userId,
                    demandId: demand.id,
                    intentKey,
                    demandType: snapshot.demandType,
                    propertyTypes: snapshot.propertyTypes,
                    province: snapshot.province,
                    district: snapshot.district,
                    keywords: snapshot.keywords,
                    strength: snapshot.strength,
                    lastSignalAt: snapshot.lastSignalAt,
                },
                update: {
                    demandId: demand.id,
                    demandType: snapshot.demandType,
                    propertyTypes: snapshot.propertyTypes,
                    province: snapshot.province,
                    district: snapshot.district,
                    keywords: snapshot.keywords,
                    strength: snapshot.strength,
                    lastSignalAt: snapshot.lastSignalAt,
                },
            });
            await this.prisma.intentPreferenceSignal.createMany({
                data: group.map((signal) => ({ intentId: intent.id, signalId: signal.id })),
                skipDuplicates: true,
            });
            results.push(intent);
        }
        return results;
    }

    async findIntents(userId: string) {
        const intents = await this.prisma.userRealEstateIntent.findMany({
            where: { userId },
            include: { _count: { select: { signals: true } } },
            orderBy: [{ status: 'asc' }, { lastSignalAt: 'desc' }],
        });
        return intents.map((intent) => ({
            ...intent,
            signalCount: intent._count.signals,
            _count: undefined,
        }));
    }

    async findSignals(userId: string) {
        const signals = await this.prisma.userPreferenceSignal.findMany({
            where: { userId },
            orderBy: { occurredAt: 'desc' },
            take: 500,
        });
        const now = new Date();
        return signals.map((signal) => ({
            ...signal,
            effectiveWeight: calculateEffectiveSignalWeight(
                signal.signalType,
                signal.baseWeight,
                signal.occurredAt,
                now,
                this.signalEventType(signal.value),
            ),
        }));
    }

    async getRealEstateContext(userId: string) {
        const anchors = await this.prisma.userLocationAnchor.findMany({
            where: { userId, isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
        return { anchors };
    }

    async updateRealEstateContext(userId: string, dto: UpdateRealEstateContextDto) {
        await this.prisma.$transaction([
            this.prisma.userLocationAnchor.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
            }),
            ...dto.anchors.map((anchor) =>
                this.prisma.userLocationAnchor.create({
                    data: {
                        userId,
                        anchorType: anchor.anchorType,
                        label: anchor.label?.trim() || null,
                        province: anchor.province?.trim() || null,
                        district: anchor.district?.trim() || null,
                        rawLocation: anchor.rawLocation.trim(),
                        baseWeight: anchor.baseWeight ?? 1,
                    },
                }),
            ),
        ]);
        await this.queueRecommendationRecompute(userId, 'USER_PROFILE_UPDATED');
        return this.getRealEstateContext(userId);
    }

    async updateIntentStatus(userId: string, intentId: string, dto: UpdateIntentStatusDto) {
        const intent = await this.prisma.userRealEstateIntent.findFirst({
            where: { id: intentId, userId },
        });
        if (!intent) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy nhu cầu BĐS');
        }
        return this.prisma.userRealEstateIntent.update({
            where: { id: intent.id },
            data: { status: dto.status },
        });
    }

    async exportNormalizedLearningData(userId: string) {
        const [signals, intents, anchors, profile] = await Promise.all([
            this.prisma.userPreferenceSignal.findMany({ where: { userId }, orderBy: { occurredAt: 'desc' } }),
            this.prisma.userRealEstateIntent.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
            this.prisma.userLocationAnchor.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
            this.prisma.userPreferenceProfile.findUnique({ where: { userId } }),
        ]);
        return {
            exportedAt: new Date().toISOString(),
            scope: 'normalized-real-estate-learning-data',
            signals,
            intents,
            anchors,
            preferenceProfile: profile,
        };
    }

    async deleteNormalizedLearningData(userId: string) {
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.userPreferenceSignal.deleteMany({ where: { userId } });
            await tx.userRealEstateIntent.deleteMany({ where: { userId } });
            await tx.userLocationAnchor.deleteMany({ where: { userId } });
            await tx.userPreferenceProfile.deleteMany({ where: { userId } });
            await tx.userBehaviorEvent.deleteMany({ where: { userId } });
            const demands = await tx.userDemand.deleteMany({ where: { userId } });
            return { deletedDemands: demands.count };
        });
        return { deleted: true, ...result };
    }

    private buildIntentSnapshot(signals: Array<any>) {
        const now = new Date();
        const scoreByType = new Map<string, number>();
        const keywordScores = new Map<string, number>();
        let strength = 0;

        for (const signal of signals) {
            const effective = calculateEffectiveSignalWeight(
                signal.signalType,
                signal.baseWeight,
                signal.occurredAt,
                now,
                this.signalEventType(signal.value),
            );
            strength += effective;
            const value = this.objectOrNull(signal.value)?.value;
            if (typeof value !== 'string') continue;
            if (signal.signalType === PreferenceSignalType.KEYWORD) {
                keywordScores.set(value, (keywordScores.get(value) ?? 0) + effective);
            } else {
                scoreByType.set(`${signal.signalType}:${value}`, effective + (scoreByType.get(`${signal.signalType}:${value}`) ?? 0));
            }
        }
        const context = this.objectOrNull(signals[0]?.value)?.context;
        const contextObject = this.objectOrNull(context);
        const transactionType = String(contextObject?.transactionType ?? TransactionType.UNKNOWN);
        return {
            demandType:
                transactionType === TransactionType.RENT
                    ? DemandType.RENT
                    : transactionType === TransactionType.SELL
                      ? DemandType.BUY
                      : DemandType.UNKNOWN,
            propertyTypes: this.topValues(scoreByType, PreferenceSignalType.PROPERTY_TYPE)
                .filter((value) => Object.values(PropertyType).includes(value as PropertyType))
                .map((value) => value as PropertyType),
            province: this.textOrNull(contextObject?.province),
            district: this.textOrNull(contextObject?.district),
            rawLocation: [contextObject?.district, contextObject?.province].filter(Boolean).join(', ') || null,
            keywords: Array.from(keywordScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([value]) => value),
            strength: Number(strength.toFixed(4)),
            confidence: Math.min(1, Math.abs(strength) / 10),
            lastSignalAt: signals[0]?.occurredAt ?? null,
            hasExternalOnly: signals.every((signal) => signal.source === PreferenceSignalSource.EXTERNAL_BEHAVIOR),
        };
    }

    private topValues(scores: Map<string, number>, type: PreferenceSignalType) {
        const prefix = `${type}:`;
        return Array.from(scores.entries())
            .filter(([key]) => key.startsWith(prefix))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([key]) => key.slice(prefix.length));
    }

    private objectOrNull(value: unknown): Record<string, any> | null {
        return value && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, any>)
            : null;
    }

    private textOrNull(value: unknown) {
        return typeof value === 'string' && value.trim() ? value.trim() : null;
    }

    private signalEventType(value: unknown) {
        return this.objectOrNull(this.objectOrNull(value)?.context)?.eventType ?? null;
    }

    private async queueRecommendationRecompute(userId: string, eventType: string) {
        const weakView = eventType === 'PROPERTY_VIEW' || eventType === 'RECOMMENDATION_VIEW';
        const availableAt = weakView ? new Date(Date.now() + 5 * 60_000) : new Date();
        const priority = weakView ? LearningJobPriority.LOW : LearningJobPriority.HIGH;
        const activeKey = `${LearningJobType.RECOMMENDATION_RECOMPUTE}:${userId}`;
        const existing = await this.prisma.learningJob.findUnique({ where: { activeKey } });
        const job =
            existing?.status === LearningJobStatus.PROCESSING
                ? await this.prisma.learningJob.update({
                      where: { id: existing.id },
                      data: {
                          priority,
                          payload: { rerunRequested: true, reason: eventType },
                      },
                  })
                : await this.prisma.learningJob.upsert({
                      where: { activeKey },
                      create: {
                          userId,
                          type: LearningJobType.RECOMMENDATION_RECOMPUTE,
                          status: LearningJobStatus.PENDING,
                          priority,
                          activeKey,
                          availableAt,
                      },
                      update: {
                          status: LearningJobStatus.PENDING,
                          priority,
                          availableAt,
                          leaseExpiresAt: null,
                          finishedAt: null,
                      },
                  });
        await this.prisma.recommendationRecomputeJob.upsert({
            where: { learningJobId: job.id },
            create: {
                learningJobId: job.id,
                userId,
                reason: weakView ? 'weak_view_micro_batch' : `strong_behavior:${eventType}`,
            },
            update: {
                reason: weakView ? 'weak_view_micro_batch' : `strong_behavior:${eventType}`,
            },
        });
    }
}
