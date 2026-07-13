import { Injectable } from '@nestjs/common';
import {
    DemandMatchStatus,
    PropertyStatus,
    UserBehaviorEventType,
    UserDemandStatus,
} from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { rankHybridMatch } from '../../shared/utils/hybrid-ranking.util.ts';
import { calculateEffectiveSignalWeight } from '../../shared/utils/preference-signal.util.ts';
import {
    matchDemandToProperties,
    MatchableDemand,
    MatchableProperty,
    MatchResult,
} from '../../shared/utils/property-matcher.util.ts';
import { UserBehaviorsService } from '../user-behaviors/user-behaviors.service.ts';
import { UserPreferencesService } from '../user-preferences/user-preferences.service.ts';
import {
    CreateRecommendationFeedbackDto,
    RecommendationFeedbackType,
} from './dto/feedback.dto.ts';
import { FilterDemandMatchesDto } from './dto/match-filter.dto.ts';
import { UpdateMatchStatusDto } from './dto/match-status.dto.ts';

@Injectable()
export class RecommendationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userBehaviorsService: UserBehaviorsService,
        private readonly userPreferencesService: UserPreferencesService,
    ) {}

    async runMatchingForDemand(demandId: string): Promise<{ matched: number; topMatches: unknown[] }> {
        const demand = await this.prisma.userDemand.findUnique({
            where: { id: demandId },
        });

        if (!demand) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy nhu cầu người dùng');
        }

        const properties = await this.prisma.property.findMany({
            where: {
                status: PropertyStatus.PUBLISHED,
                createdByUserId: { not: null },
            },
            include: { location: true, nearbyPlaces: true },
        });
        const matchableDemand: MatchableDemand = {
            demandType: demand.demandType,
            propertyTypes: demand.propertyTypes,
            minPrice: demand.minPrice === null ? null : Number(demand.minPrice),
            maxPrice: demand.maxPrice === null ? null : Number(demand.maxPrice),
            minArea: demand.minArea,
            maxArea: demand.maxArea,
            province: demand.province,
            district: demand.district,
            rawLocation: demand.rawLocation,
            keywords: demand.keywords,
        };
        const matchableProperties: MatchableProperty[] = properties.map((property) => ({
            id: property.id,
            status: property.status,
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
            nearbyPlaces: property.nearbyPlaces,
            title: property.title,
            description: property.description,
            location: property.location
                ? {
                      province: property.location.province,
                      district: property.location.district,
                      rawAddress: property.location.rawAddress,
                  }
                : null,
            updatedAt: property.updatedAt,
        }));
        const propertyById = new Map(matchableProperties.map((property) => [property.id, property]));
        const { matches } = matchDemandToProperties(matchableDemand, matchableProperties);
        const newPropertyIds = new Set(matches.map((match) => match.propertyId));
        const existingMatches = await this.prisma.demandPropertyMatch.findMany({
            where: {
                demandId: demandId,
                propertyId: { in: Array.from(newPropertyIds) },
            },
            select: {
                propertyId: true,
                status: true,
            },
        });
        const previousStatusByPropertyId = new Map(
            existingMatches.map((match) => [match.propertyId, match.status]),
        );
        const preferenceProfile = demand.userId
            ? await this.prisma.userPreferenceProfile.findUnique({ where: { userId: demand.userId } })
            : null;
        const feedbackEventsByPropertyId = await this.findFeedbackEventsByPropertyId(
            demand.userId,
            Array.from(newPropertyIds),
        );
        const intent = demand.userId && this.prisma.userRealEstateIntent?.findUnique
            ? await this.prisma.userRealEstateIntent.findUnique({ where: { demandId: demand.id } })
            : null;
        const canonicalSignals =
            demand.userId && this.prisma.userPreferenceSignal?.findMany
                ? await this.prisma.userPreferenceSignal.findMany({
                      where: { userId: demand.userId },
                      orderBy: { occurredAt: 'desc' },
                      take: 500,
                  })
                : [];
        const locationAnchors =
            demand.userId && this.prisma.userLocationAnchor?.findMany
                ? await this.prisma.userLocationAnchor.findMany({
                      where: { userId: demand.userId, isActive: true },
                  })
                : [];
        const now = new Date();
        const scoredMatches = matches
            .map((match) =>
                rankHybridMatch(match, propertyById.get(match.propertyId) ?? null, {
                    preferenceProfile: preferenceProfile,
                    previousStatus: previousStatusByPropertyId.get(match.propertyId),
                    feedbackEvents: feedbackEventsByPropertyId.get(match.propertyId) ?? [],
                    canonicalSignals: canonicalSignals.map((signal) => ({
                        signalType: signal.signalType,
                        value: signal.value,
                        effectiveWeight: calculateEffectiveSignalWeight(
                            signal.signalType,
                            signal.baseWeight,
                            signal.occurredAt,
                            now,
                            this.signalEventType(signal.value),
                        ),
                    })),
                    intent: intent,
                    locationAnchors: locationAnchors,
                    now,
                }),
            )
            .filter((match): match is NonNullable<typeof match> => Boolean(match))
            .sort((a, b) => b.matchScore - a.matchScore);

        await Promise.all(
            scoredMatches.map((match) => {
                const previousStatus = previousStatusByPropertyId.get(match.propertyId);
                const nextStatus = this.getStatusAfterRecompute(previousStatus);

                return this.prisma.demandPropertyMatch.upsert({
                    where: {
                        demandId_propertyId: {
                            demandId: demandId,
                            propertyId: match.propertyId,
                        },
                    },
                    create: {
                        demandId: demandId,
                        propertyId: match.propertyId,
                        matchScore: match.matchScore,
                        matchReasons: match.matchReasons,
                        scoreBreakdown: match.scoreBreakdown as object,
                        status: DemandMatchStatus.ACTIVE,
                    },
                    update: {
                        matchScore: match.matchScore,
                        matchReasons: match.matchReasons,
                        scoreBreakdown: match.scoreBreakdown as object,
                        status: nextStatus,
                    },
                });
            }),
        );

        await this.prisma.demandPropertyMatch.updateMany({
            where: {
                demandId: demandId,
                propertyId: { notIn: Array.from(newPropertyIds) },
                status: DemandMatchStatus.ACTIVE,
            },
            data: { status: DemandMatchStatus.OUTDATED },
        });
        await this.prisma.userDemand.update({
            where: { id: demandId },
            data: { status: UserDemandStatus.MATCHED },
        });

        const topMatches = scoredMatches.slice(0, 5).map((match) => ({
            propertyId: match.propertyId,
            matchScore: match.matchScore,
            matchReasons: match.matchReasons,
        }));

        return { matched: scoredMatches.length, topMatches: topMatches };
    }

    async updateMatchStatus(matchId: string, dto: UpdateMatchStatusDto) {
        const existingMatch = await this.prisma.demandPropertyMatch.findFirst({
            where: {
                id: matchId,
                property: { createdByUserId: { not: null } },
            },
            select: { id: true },
        });

        if (!existingMatch) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy kết quả gợi ý');
        }

        const updatedMatch = await this.prisma.demandPropertyMatch.update({
            where: { id: matchId },
            data: { status: dto.status },
            include: {
                property: {
                    include: { location: true, media: { take: 1, orderBy: { sortOrder: 'asc' } } },
                },
            },
        });

        return this.toMatchResponse(updatedMatch);
    }

    async createFeedback(userId: string, matchId: string, dto: CreateRecommendationFeedbackDto) {
        const match = await this.prisma.demandPropertyMatch.findFirst({
            where: {
                id: matchId,
                demand: { userId: userId },
                property: {
                    createdByUserId: { not: null },
                    status: PropertyStatus.PUBLISHED,
                },
            },
            include: {
                property: {
                    include: { location: true, media: { take: 1, orderBy: { sortOrder: 'asc' } } },
                },
                demand: { include: { intent: true } },
            },
        });

        if (!match) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy gợi ý');
        }

        const feedback = await this.userBehaviorsService.create(userId, {
            eventType: this.mapFeedbackToEventType(dto.feedbackType),
            propertyId: match.propertyId,
            demandId: match.demandId,
            matchId: match.id,
            metadata: dto.metadata,
        });
        const nextStatus = this.getStatusAfterFeedback(dto.feedbackType);
        const updatedMatch = nextStatus
            ? await this.prisma.demandPropertyMatch.update({
                  where: { id: matchId },
                  data: { status: nextStatus },
                  include: {
                      property: {
                          include: { location: true, media: { take: 1, orderBy: { sortOrder: 'asc' } } },
                      },
                  },
              })
            : match;

        return {
            feedback: feedback,
            match: this.toMatchResponse(updatedMatch),
        };
    }

    async recomputeForUser(userId: string) {
        const profile = await this.userPreferencesService.recomputeMine(userId);
        const demands = await this.prisma.userDemand.findMany({
            where: {
                userId: userId,
                status: { in: [UserDemandStatus.ANALYZED, UserDemandStatus.MATCHED] },
            },
            select: { id: true },
        });
        let matchedCount = 0;

        for (const demand of demands) {
            const result = await this.runMatchingForDemand(demand.id);
            matchedCount += result.matched;
        }

        return {
            profile: profile,
            demandCount: demands.length,
            matchedCount: matchedCount,
        };
    }

    async findMatchesByDemand(demandId: string, query: FilterDemandMatchesDto) {
        const demand = await this.prisma.userDemand.findUnique({ where: { id: demandId } });

        if (!demand) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy nhu cầu người dùng');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where: any = {
            demandId: demandId,
            property: { createdByUserId: { not: null } },
        };

        if (query.status) where.status = query.status;
        if (query.minScore !== undefined) where.matchScore = { gte: query.minScore };

        const [items, total] = await Promise.all([
            this.prisma.demandPropertyMatch.findMany({
                where: where,
                include: {
                    property: {
                        include: { location: true, media: { take: 1, orderBy: { sortOrder: 'asc' } } },
                    },
                },
                orderBy: { matchScore: 'desc' },
                skip: skip,
                take: limit,
            }),
            this.prisma.demandPropertyMatch.count({ where: where }),
        ]);

        return buildPaginatedResult(items.map((item) => this.toMatchResponse(item)), page, limit, total);
    }

    async findRecommendationsForUser(userId: string, query: FilterDemandMatchesDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where: any = {
            demand: { userId: userId },
            status: DemandMatchStatus.ACTIVE,
            property: {
                status: PropertyStatus.PUBLISHED,
                createdByUserId: { not: null },
            },
        };

        if (query.minScore !== undefined) where.matchScore = { gte: query.minScore };

        const candidates = await this.prisma.demandPropertyMatch.findMany({
            where: where,
            include: {
                property: {
                    include: { location: true, media: { take: 1, orderBy: { sortOrder: 'asc' } } },
                },
                demand: { include: { intent: true } },
            },
            orderBy: { matchScore: 'desc' },
            take: 500,
        });
        const uniqueByProperty = new Map<string, (typeof candidates)[number]>();

        for (const candidate of candidates) {
            if (!uniqueByProperty.has(candidate.propertyId)) {
                uniqueByProperty.set(candidate.propertyId, candidate);
            }
        }

        const uniqueItems = Array.from(uniqueByProperty.values());
        const items = uniqueItems.slice(skip, skip + limit);
        return buildPaginatedResult(
            items.map((item) => this.toMatchResponse(item)),
            page,
            limit,
            uniqueItems.length,
        );
    }

    private toMatchResponse(item: any) {
        return {
            id: item.id,
            demandId: item.demandId,
            propertyId: item.propertyId,
            matchScore: item.matchScore,
            matchReasons: item.matchReasons,
            scoreBreakdown: item.scoreBreakdown,
            status: item.status,
            intent: item.demand?.intent
                ? {
                      id: item.demand.intent.id,
                      intentKey: item.demand.intent.intentKey,
                      demandType: item.demand.intent.demandType,
                      status: item.demand.intent.status,
                  }
                : null,
            property: item.property
                ? {
                      id: item.property.id,
                      title: item.property.title,
                      transactionType: item.property.transactionType,
                      propertyType: item.property.propertyType,
                      price: item.property.price === null ? null : Number(item.property.price),
                      area: item.property.area,
                      bedrooms: item.property.bedrooms,
                      bathrooms: item.property.bathrooms,
                      furnishingStatus: item.property.furnishingStatus,
                      legalStatus: item.property.legalStatus,
                      direction: item.property.direction,
                      amenities: item.property.amenities ?? [],
                      status: item.property.status,
                      location: item.property.location,
                      thumbnail: item.property.media?.[0]?.url ?? null,
                  }
                : null,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        };
    }

    private getStatusAfterRecompute(previousStatus?: DemandMatchStatus) {
        if (
            previousStatus === DemandMatchStatus.DISMISSED ||
            previousStatus === DemandMatchStatus.CONTACTED
        ) {
            return previousStatus;
        }

        return DemandMatchStatus.ACTIVE;
    }

    private async findFeedbackEventsByPropertyId(userId: string | null, propertyIds: string[]) {
        const eventsByPropertyId = new Map<string, Array<{ eventType: UserBehaviorEventType }>>();

        if (!userId || propertyIds.length === 0 || !this.prisma.userBehaviorEvent?.findMany) {
            return eventsByPropertyId;
        }

        const events = await this.prisma.userBehaviorEvent.findMany({
            where: {
                userId: userId,
                propertyId: { in: propertyIds },
                eventType: {
                    in: [
                        UserBehaviorEventType.RECOMMENDATION_VIEW,
                        UserBehaviorEventType.RECOMMENDATION_CLICK,
                        UserBehaviorEventType.RECOMMENDATION_SAVE,
                        UserBehaviorEventType.RECOMMENDATION_DISMISS,
                        UserBehaviorEventType.RECOMMENDATION_CONTACT,
                    ],
                },
            },
            select: {
                propertyId: true,
                eventType: true,
            },
        });

        for (const event of events) {
            if (!event.propertyId) {
                continue;
            }

            eventsByPropertyId.set(event.propertyId, [
                ...(eventsByPropertyId.get(event.propertyId) ?? []),
                { eventType: event.eventType },
            ]);
        }

        return eventsByPropertyId;
    }

    private applyBehaviorBoost(
        match: MatchResult,
        property: MatchableProperty | null,
        profile: any,
        previousStatus?: DemandMatchStatus,
    ): MatchResult {
        if (!property || !profile) {
            return match;
        }

        let boost = 0;
        const reasons: string[] = [];

        if (this.hasPositiveScore(profile.preferredTransactionTypes, property.transactionType)) {
            boost += 2;
            reasons.push('Phù hợp với loại giao dịch người dùng thường quan tâm');
        }
        if (this.hasPositiveScore(profile.preferredPropertyTypes, property.propertyType)) {
            boost += 3;
            reasons.push('Phù hợp với loại BĐS người dùng thường quan tâm');
        }
        if (this.hasLocationPreference(profile.preferredLocations, property.location)) {
            boost += 3;
            reasons.push('Phù hợp với khu vực người dùng thường quan tâm');
        }
        if (this.isInRange(property.price, profile.preferredMinPrice, profile.preferredMaxPrice)) {
            boost += 1;
        }
        if (this.isInRange(property.area, profile.preferredMinArea, profile.preferredMaxArea)) {
            boost += 1;
        }
        if (previousStatus === DemandMatchStatus.DISMISSED) {
            boost -= 10;
            reasons.push('Người dùng đã từng bỏ qua gợi ý này');
        }
        if (previousStatus === DemandMatchStatus.CONTACTED) {
            boost -= 5;
            reasons.push('Người dùng đã từng liên hệ gợi ý này');
        }

        const boundedBoost = this.clamp(boost, -10, 10);
        if (boundedBoost === 0) {
            return match;
        }

        return {
            ...match,
            matchScore: this.clamp(match.matchScore + boundedBoost, 0, 100),
            matchReasons: [...match.matchReasons, ...reasons],
            scoreBreakdown: {
                ...match.scoreBreakdown,
                behaviorBoost: boundedBoost,
            } as any,
        };
    }

    private mapFeedbackToEventType(feedbackType: RecommendationFeedbackType) {
        const map: Record<RecommendationFeedbackType, UserBehaviorEventType> = {
            [RecommendationFeedbackType.VIEWED]: UserBehaviorEventType.RECOMMENDATION_VIEW,
            [RecommendationFeedbackType.CLICKED]: UserBehaviorEventType.RECOMMENDATION_CLICK,
            [RecommendationFeedbackType.SAVED]: UserBehaviorEventType.RECOMMENDATION_SAVE,
            [RecommendationFeedbackType.DISMISSED]: UserBehaviorEventType.RECOMMENDATION_DISMISS,
            [RecommendationFeedbackType.CONTACTED]: UserBehaviorEventType.RECOMMENDATION_CONTACT,
        };

        return map[feedbackType];
    }

    private getStatusAfterFeedback(feedbackType: RecommendationFeedbackType) {
        if (feedbackType === RecommendationFeedbackType.DISMISSED) {
            return DemandMatchStatus.DISMISSED;
        }
        if (feedbackType === RecommendationFeedbackType.CONTACTED) {
            return DemandMatchStatus.CONTACTED;
        }

        return null;
    }

    private hasPositiveScore(mapValue: unknown, key: string) {
        if (!mapValue || typeof mapValue !== 'object' || Array.isArray(mapValue)) {
            return false;
        }

        const score = Number((mapValue as Record<string, unknown>)[key]);
        return Number.isFinite(score) && score > 0;
    }

    private hasLocationPreference(
        mapValue: unknown,
        location: MatchableProperty['location'],
    ) {
        if (!location || !mapValue || typeof mapValue !== 'object' || Array.isArray(mapValue)) {
            return false;
        }

        const candidates = [
            [location.district, location.province].filter(Boolean).join(', '),
            location.district,
            location.province,
            location.rawAddress,
        ]
            .filter((value): value is string => Boolean(value))
            .map((value) => value.toLowerCase());
        const locationScores = mapValue as Record<string, unknown>;

        return Object.entries(locationScores).some(([key, score]) => {
            const numericScore = Number(score);
            const normalizedKey = key.toLowerCase();

            return (
                Number.isFinite(numericScore) &&
                numericScore > 0 &&
                candidates.some(
                    (candidate) =>
                        candidate.includes(normalizedKey) || normalizedKey.includes(candidate),
                )
            );
        });
    }

    private isInRange(value: number | null, minValue: unknown, maxValue: unknown) {
        if (value === null) {
            return false;
        }

        const min = Number(minValue);
        const max = Number(maxValue);
        const hasMin = Number.isFinite(min);
        const hasMax = Number.isFinite(max);

        if (!hasMin && !hasMax) {
            return false;
        }

        return (!hasMin || value >= min) && (!hasMax || value <= max);
    }

    private clamp(value: number, min: number, max: number) {
        return Math.min(max, Math.max(min, value));
    }

    private signalEventType(value: unknown) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        const context = (value as Record<string, unknown>).context;
        if (!context || typeof context !== 'object' || Array.isArray(context)) return null;
        const eventType = (context as Record<string, unknown>).eventType;
        return typeof eventType === 'string' ? eventType : null;
    }
}
