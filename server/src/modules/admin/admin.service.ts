import { Injectable } from '@nestjs/common';
import { InquiryStatus, Prisma, PropertyStatus } from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { AdminFilterInquiriesDto } from './dto/admin-filter-inquiries.dto.ts';
import { AdminFilterPropertiesDto } from './dto/admin-filter-properties.dto.ts';
import { AdminFilterUsersDto } from './dto/admin-filter-users.dto.ts';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto.ts';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto.ts';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) {}

    async getOverview() {
        const [
            totalProperties,
            totalUsers,
            totalInquiries,
            pendingInquiries,
            propertiesByStatus,
        ] = await Promise.all([
            this.prisma.property.count({
                where: { createdByUserId: { not: null } },
            }),
            this.prisma.user.count(),
            this.prisma.inquiry.count({
                where: { property: { createdByUserId: { not: null } } },
            }),
            this.prisma.inquiry.count({
                where: {
                    status: InquiryStatus.NEW,
                    property: { createdByUserId: { not: null } },
                },
            }),
            this.prisma.property.groupBy({
                by: ['status'],
                where: { createdByUserId: { not: null } },
                _count: {
                    _all: true,
                },
            }),
        ]);

        return {
            totalProperties: totalProperties,
            totalUsers: totalUsers,
            totalInquiries: totalInquiries,
            pendingInquiries: pendingInquiries,
            propertiesByStatus: this.toPropertyStatusCount(propertiesByStatus),
        };
    }

    async findUsers(query: AdminFilterUsersDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const keyword = query.keyword?.trim();
        const where: Prisma.UserWhereInput = keyword
            ? {
                  OR: [
                      { email: { contains: keyword, mode: 'insensitive' } },
                      { fullName: { contains: keyword, mode: 'insensitive' } },
                  ],
              }
            : {};
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where: where,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where: where }),
        ]);

        return buildPaginatedResult(items, page, limit, total);
    }

    async findProperties(query: AdminFilterPropertiesDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = this.buildPropertyWhere(query);

        const [items, total] = await Promise.all([
            this.prisma.property.findMany({
                where: where,
                include: this.getPropertyInclude(),
                orderBy: {
                    createdAt: 'desc',
                },
                skip: skip,
                take: limit,
            }),
            this.prisma.property.count({
                where: where,
            }),
        ]);

        return buildPaginatedResult(
            items.map((item) => this.toPropertyResponse(item)),
            page,
            limit,
            total,
        );
    }

    async findProperty(id: string) {
        const property = await this.prisma.property.findFirst({
            where: {
                id: id,
                createdByUserId: { not: null },
            },
            include: this.getPropertyInclude(),
        });

        if (!property) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy bất động sản');
        }

        return this.toPropertyResponse(property);
    }

    async updatePropertyStatus(id: string, dto: UpdatePropertyStatusDto) {
        const existing = await this.findProperty(id);
        this.validatePropertyStatusTransition(existing.status, dto.status);

        const property = await this.prisma.property.update({
            where: {
                id: id,
            },
            data: {
                status: dto.status,
            },
            include: this.getPropertyInclude(),
        });

        return this.toPropertyResponse(property);
    }

    private validatePropertyStatusTransition(
        currentStatus: PropertyStatus,
        nextStatus: PropertyStatus,
    ) {
        const allowedTransitions: Record<PropertyStatus, PropertyStatus[]> = {
            [PropertyStatus.DRAFT]: [PropertyStatus.DRAFT, PropertyStatus.ARCHIVED],
            [PropertyStatus.PENDING_REVIEW]: [
                PropertyStatus.PENDING_REVIEW,
                PropertyStatus.DRAFT,
                PropertyStatus.PUBLISHED,
                PropertyStatus.ARCHIVED,
            ],
            [PropertyStatus.PUBLISHED]: [
                PropertyStatus.PUBLISHED,
                PropertyStatus.ARCHIVED,
            ],
            [PropertyStatus.ARCHIVED]: [PropertyStatus.ARCHIVED],
        };

        if (!allowedTransitions[currentStatus].includes(nextStatus)) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Chỉ tin đang chờ duyệt mới có thể được công khai',
            );
        }
    }

    async findInquiries(query: AdminFilterInquiriesDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where: Prisma.InquiryWhereInput = {
            property: { createdByUserId: { not: null } },
        };

        if (query.status) {
            where.status = query.status;
        }

        const [items, total] = await Promise.all([
            this.prisma.inquiry.findMany({
                where: where,
                include: this.getInquiryInclude(),
                orderBy: {
                    createdAt: 'desc',
                },
                skip: skip,
                take: limit,
            }),
            this.prisma.inquiry.count({
                where: where,
            }),
        ]);

        return buildPaginatedResult(
            items.map((item) => this.toInquiryResponse(item)),
            page,
            limit,
            total,
        );
    }

    async findInquiry(id: string) {
        const inquiry = await this.prisma.inquiry.findFirst({
            where: {
                id: id,
                property: { createdByUserId: { not: null } },
            },
            include: this.getInquiryInclude(),
        });

        if (!inquiry) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy yêu cầu liên hệ');
        }

        return this.toInquiryResponse(inquiry);
    }

    async updateInquiryStatus(id: string, dto: UpdateInquiryStatusDto) {
        await this.findInquiry(id);

        const inquiry = await this.prisma.inquiry.update({
            where: {
                id: id,
            },
            data: {
                status: dto.status,
            },
            include: this.getInquiryInclude(),
        });

        return this.toInquiryResponse(inquiry);
    }

    private buildPropertyWhere(query: AdminFilterPropertiesDto): Prisma.PropertyWhereInput {
        const where: Prisma.PropertyWhereInput = {
            createdByUserId: { not: null },
        };

        if (query.keyword) {
            where.OR = [
                {
                    title: {
                        contains: query.keyword,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: query.keyword,
                        mode: 'insensitive',
                    },
                },
                {
                    location: {
                        rawAddress: {
                            contains: query.keyword,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        if (query.transactionType) {
            where.transactionType = query.transactionType;
        }

        if (query.propertyType) {
            where.propertyType = query.propertyType;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            where.price = {};

            if (query.minPrice !== undefined) {
                where.price.gte = query.minPrice;
            }

            if (query.maxPrice !== undefined) {
                where.price.lte = query.maxPrice;
            }
        }

        return where;
    }

    private getPropertyInclude() {
        return {
            location: true,
            media: {
                orderBy: {
                    sortOrder: 'asc' as const,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                },
            },
        };
    }

    private getInquiryInclude() {
        return {
            user: true,
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

    private toPropertyStatusCount(
        rows: Array<{ status: PropertyStatus; _count: { _all: number } }>,
    ) {
        const result: Record<PropertyStatus, number> = {
            [PropertyStatus.DRAFT]: 0,
            [PropertyStatus.PENDING_REVIEW]: 0,
            [PropertyStatus.PUBLISHED]: 0,
            [PropertyStatus.ARCHIVED]: 0,
        };

        rows.forEach((row) => {
            result[row.status] = row._count._all;
        });

        return result;
    }

    private toPropertyResponse(property: any) {
        return {
            id: property.id,
            title: property.title,
            description: property.description,
            transactionType: property.transactionType,
            propertyType: property.propertyType,
            price: property.price === null ? null : Number(property.price),
            area: property.area,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            furnishingStatus: property.furnishingStatus,
            legalStatus: property.legalStatus,
            direction: property.direction,
            amenities: property.amenities ?? [],
            latitude: property.latitude,
            longitude: property.longitude,
            contactPhone: property.contactPhone,
            status: property.status,
            createdByUserId: property.createdByUserId,
            createdBy: property.createdBy ?? null,
            location: property.location,
            media: property.media ?? [],
            createdAt: property.createdAt.toISOString(),
            updatedAt: property.updatedAt.toISOString(),
        };
    }

    private toInquiryResponse(inquiry: any) {
        return {
            id: inquiry.id,
            propertyId: inquiry.propertyId,
            userId: inquiry.userId,
            message: inquiry.message,
            contactName: inquiry.contactName,
            contactPhone: inquiry.contactPhone,
            status: inquiry.status,
            createdAt: inquiry.createdAt.toISOString(),
            updatedAt: inquiry.updatedAt.toISOString(),
            user: this.toUserSummary(inquiry.user),
            property: this.toPropertySummary(inquiry.property),
        };
    }

    private toUserSummary(user: any) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
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
