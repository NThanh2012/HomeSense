import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import {
    calculateUserPreference,
    PreferenceSourceEvent,
} from '../../shared/utils/user-preference-calculator.util.ts';

@Injectable()
export class UserPreferencesService {
    constructor(private readonly prisma: PrismaService) {}

    async findMine(userId: string) {
        const profile = await this.prisma.userPreferenceProfile.findUnique({
            where: { userId: userId },
        });

        return profile ? this.toResponse(profile) : this.buildEmptyProfile(userId);
    }

    async recomputeMine(userId: string) {
        const events = await this.prisma.userBehaviorEvent.findMany({
            where: { userId: userId },
            include: this.getEventInclude(),
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        const calculated = calculateUserPreference(
            events.map((event) => this.toPreferenceSourceEvent(event)),
        );
        const now = new Date();
        const lastEventAt = events[0]?.occurredAt ?? events[0]?.createdAt ?? null;
        const profile = await this.prisma.userPreferenceProfile.upsert({
            where: { userId: userId },
            create: {
                userId: userId,
                preferredTransactionTypes: calculated.preferredTransactionTypes,
                preferredPropertyTypes: calculated.preferredPropertyTypes,
                preferredLocations: calculated.preferredLocations,
                keywords: calculated.keywords,
                preferredMinPrice: calculated.preferredMinPrice,
                preferredMaxPrice: calculated.preferredMaxPrice,
                preferredMinArea: calculated.preferredMinArea,
                preferredMaxArea: calculated.preferredMaxArea,
                lastComputedAt: now,
                lastEventAt: lastEventAt,
                isStale: false,
            },
            update: {
                preferredTransactionTypes: calculated.preferredTransactionTypes,
                preferredPropertyTypes: calculated.preferredPropertyTypes,
                preferredLocations: calculated.preferredLocations,
                keywords: calculated.keywords,
                preferredMinPrice: calculated.preferredMinPrice,
                preferredMaxPrice: calculated.preferredMaxPrice,
                preferredMinArea: calculated.preferredMinArea,
                preferredMaxArea: calculated.preferredMaxArea,
                lastComputedAt: now,
                lastEventAt: lastEventAt,
                isStale: false,
            },
        });

        return this.toResponse(profile);
    }

    private getEventInclude() {
        return {
            property: {
                include: { location: true },
            },
            match: {
                include: {
                    property: {
                        include: { location: true },
                    },
                },
            },
        };
    }

    private toPreferenceSourceEvent(event: any): PreferenceSourceEvent {
        return {
            eventType: event.eventType,
            keyword: event.keyword,
            filters: this.objectOrNull(event.filters),
            metadata: this.objectOrNull(event.metadata),
            property: event.property ? this.toPreferenceProperty(event.property) : null,
            match: event.match
                ? {
                      property: event.match.property
                          ? this.toPreferenceProperty(event.match.property)
                          : null,
                  }
                : null,
        };
    }

    private toPreferenceProperty(property: any) {
        return {
            transactionType: property.transactionType,
            propertyType: property.propertyType,
            price: property.price === null ? null : Number(property.price),
            area: property.area,
            location: property.location,
        };
    }

    private objectOrNull(value: Prisma.JsonValue | null): Record<string, unknown> | null {
        if (!value || Array.isArray(value) || typeof value !== 'object') {
            return null;
        }

        return value as Record<string, unknown>;
    }

    private buildEmptyProfile(userId: string) {
        return {
            id: null,
            userId: userId,
            preferredTransactionTypes: {},
            preferredPropertyTypes: {},
            preferredLocations: {},
            keywords: {},
            preferredMinPrice: null,
            preferredMaxPrice: null,
            preferredMinArea: null,
            preferredMaxArea: null,
            lastComputedAt: null,
            lastEventAt: null,
            isStale: false,
            createdAt: null,
            updatedAt: null,
        };
    }

    private toResponse(profile: any) {
        return {
            id: profile.id,
            userId: profile.userId,
            preferredTransactionTypes: profile.preferredTransactionTypes ?? {},
            preferredPropertyTypes: profile.preferredPropertyTypes ?? {},
            preferredLocations: profile.preferredLocations ?? {},
            keywords: profile.keywords ?? {},
            preferredMinPrice:
                profile.preferredMinPrice === null ? null : Number(profile.preferredMinPrice),
            preferredMaxPrice:
                profile.preferredMaxPrice === null ? null : Number(profile.preferredMaxPrice),
            preferredMinArea: profile.preferredMinArea,
            preferredMaxArea: profile.preferredMaxArea,
            lastComputedAt: profile.lastComputedAt?.toISOString() ?? null,
            lastEventAt: profile.lastEventAt?.toISOString() ?? null,
            isStale: profile.isStale ?? false,
            createdAt: profile.createdAt?.toISOString() ?? null,
            updatedAt: profile.updatedAt?.toISOString() ?? null,
        };
    }
}
