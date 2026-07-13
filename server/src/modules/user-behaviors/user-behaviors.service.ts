import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { CreateUserBehaviorDto } from './dto/create-user-behavior.dto.ts';
import { FilterUserBehaviorDto } from './dto/filter-user-behavior.dto.ts';
import { UserLearningService } from '../user-learning/user-learning.service.ts';

@Injectable()
export class UserBehaviorsService {
    constructor(
        private readonly prisma: PrismaService,
        @Optional() private readonly userLearningService?: UserLearningService,
    ) {}

    async create(userId: string, dto: CreateUserBehaviorDto) {
        const data = this.buildCreateData(userId, dto);

        if (dto.eventKey) {
            const event = await this.prisma.userBehaviorEvent.upsert({
                where: {
                    eventKey: dto.eventKey,
                },
                create: data,
                update: data,
                include: this.getInclude(),
            });

            await this.markPreferenceStale(userId, event.createdAt);
            await this.materializeSignals(userId, event.id);
            return this.toResponse(event);
        }

        const event = await this.prisma.userBehaviorEvent.create({
            data: data,
            include: this.getInclude(),
        });

        await this.markPreferenceStale(userId, event.createdAt);
        await this.materializeSignals(userId, event.id);
        return this.toResponse(event);
    }

    async findMine(userId: string, query: FilterUserBehaviorDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where: Prisma.UserBehaviorEventWhereInput = {
            userId: userId,
        };

        if (query.eventType) {
            where.eventType = query.eventType;
        }

        const [items, total] = await Promise.all([
            this.prisma.userBehaviorEvent.findMany({
                where: where,
                include: this.getInclude(),
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: limit,
            }),
            this.prisma.userBehaviorEvent.count({ where: where }),
        ]);

        return buildPaginatedResult(items.map((item) => this.toResponse(item)), page, limit, total);
    }

    private buildCreateData(userId: string, dto: CreateUserBehaviorDto): Prisma.UserBehaviorEventUncheckedCreateInput {
        return {
            userId: userId,
            eventType: dto.eventType,
            propertyId: this.normalizeOptionalText(dto.propertyId),
            demandId: this.normalizeOptionalText(dto.demandId),
            matchId: this.normalizeOptionalText(dto.matchId),
            keyword: this.normalizeOptionalText(dto.keyword),
            filters: this.toJson(dto.filters),
            metadata: this.toJson(dto.metadata),
            eventKey: this.normalizeOptionalText(dto.eventKey),
        };
    }

    private getInclude() {
        return {
            property: {
                include: { location: true },
            },
            demand: true,
            match: {
                include: {
                    property: {
                        include: { location: true },
                    },
                },
            },
        };
    }

    private toResponse(event: any) {
        return {
            id: event.id,
            userId: event.userId,
            eventType: event.eventType,
            propertyId: event.propertyId,
            demandId: event.demandId,
            matchId: event.matchId,
            keyword: event.keyword,
            filters: event.filters,
            metadata: event.metadata,
            eventKey: event.eventKey,
            property: event.property ? this.toPropertySummary(event.property) : null,
            createdAt: event.createdAt.toISOString(),
        };
    }

    private toPropertySummary(property: any) {
        return {
            id: property.id,
            title: property.title,
            transactionType: property.transactionType,
            propertyType: property.propertyType,
            price: property.price === null ? null : Number(property.price),
            area: property.area,
            location: property.location,
        };
    }

    private normalizeOptionalText(value?: string) {
        const normalized = value?.trim();
        return normalized || undefined;
    }

    private toJson(value?: Record<string, unknown>) {
        return value === undefined ? undefined : (value as Prisma.InputJsonValue);
    }

    private async markPreferenceStale(userId: string, eventAt: Date) {
        if (!this.prisma.userPreferenceProfile?.updateMany) return;
        await this.prisma.userPreferenceProfile.updateMany({
            where: { userId: userId },
            data: {
                isStale: true,
                lastEventAt: eventAt,
            },
        });
    }

    private async materializeSignals(userId: string, eventId: string) {
        if (!this.userLearningService) return;
        await this.userLearningService.materializeBehaviorEvent(userId, eventId);
    }
}
