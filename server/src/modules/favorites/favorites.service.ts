import { Injectable } from '@nestjs/common';
import { PropertyStatus } from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { CreateFavoriteDto } from './dto/create-favorite.dto.ts';

@Injectable()
export class FavoritesService {
    constructor(private readonly prisma: PrismaService) {}

    async add(userId: string, dto: CreateFavoriteDto) {
        await this.ensurePropertyExists(dto.propertyId);

        const existingFavorite = await this.prisma.favorite.findUnique({
            where: {
                userId_propertyId: {
                    userId: userId,
                    propertyId: dto.propertyId,
                },
            },
            include: this.getInclude(),
        });

        if (existingFavorite) {
            return this.toResponse(existingFavorite);
        }

        const favorite = await this.prisma.favorite.create({
            data: {
                userId: userId,
                propertyId: dto.propertyId,
            },
            include: this.getInclude(),
        });

        return this.toResponse(favorite);
    }

    async findMine(userId: string, query: PaginationQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where: {
                    userId: userId,
                    property: {
                        createdByUserId: { not: null },
                        status: PropertyStatus.PUBLISHED,
                    },
                },
                include: this.getInclude(),
                orderBy: {
                    createdAt: 'desc',
                },
                skip: skip,
                take: limit,
            }),
            this.prisma.favorite.count({
                where: {
                    userId: userId,
                    property: {
                        createdByUserId: { not: null },
                        status: PropertyStatus.PUBLISHED,
                    },
                },
            }),
        ]);

        return buildPaginatedResult(
            items.map((item) => this.toResponse(item)),
            page,
            limit,
            total,
        );
    }

    async remove(userId: string, propertyId: string) {
        await this.prisma.favorite.deleteMany({
            where: {
                userId: userId,
                propertyId: propertyId,
                property: {
                    createdByUserId: { not: null },
                    status: PropertyStatus.PUBLISHED,
                },
            },
        });

        return {
            propertyId: propertyId,
            removed: true,
        };
    }

    async check(userId: string, propertyId: string) {
        const count = await this.prisma.favorite.count({
            where: {
                userId: userId,
                propertyId: propertyId,
                property: {
                    createdByUserId: { not: null },
                    status: PropertyStatus.PUBLISHED,
                },
            },
        });

        return {
            propertyId: propertyId,
            favorited: count > 0,
        };
    }

    private async ensurePropertyExists(propertyId: string) {
        const property = await this.prisma.property.findFirst({
            where: {
                id: propertyId,
                createdByUserId: { not: null },
                status: PropertyStatus.PUBLISHED,
            },
            select: {
                id: true,
            },
        });

        if (!property) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy bất động sản');
        }
    }

    private getInclude() {
        return {
            property: {
                include: {
                    location: true,
                    media: {
                        orderBy: {
                            sortOrder: 'asc' as const,
                        },
                    },
                },
            },
        };
    }

    private toResponse(favorite: any) {
        return {
            id: favorite.id,
            propertyId: favorite.propertyId,
            createdAt: favorite.createdAt.toISOString(),
            property: this.toPropertySummary(favorite.property),
        };
    }

    private toPropertySummary(property: any) {
        return {
            id: property.id,
            title: property.title,
            description: property.description,
            transactionType: property.transactionType,
            propertyType: property.propertyType,
            price: property.price === null ? null : Number(property.price),
            area: property.area,
            status: property.status,
            location: property.location,
            media: property.media ?? [],
            createdAt: property.createdAt.toISOString(),
            updatedAt: property.updatedAt.toISOString(),
        };
    }
}
