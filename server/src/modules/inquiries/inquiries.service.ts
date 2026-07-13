import { Injectable } from '@nestjs/common';
import { InquiryStatus, PropertyStatus } from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { CreateInquiryDto } from './dto/create-inquiry.dto.ts';

@Injectable()
export class InquiriesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId: string, dto: CreateInquiryDto) {
        await this.ensurePropertyExists(dto.propertyId);

        const inquiry = await this.prisma.inquiry.create({
            data: {
                userId: userId,
                propertyId: dto.propertyId,
                message: dto.message,
                contactName: this.normalizeOptionalText(dto.contactName),
                contactPhone: this.normalizeOptionalText(dto.contactPhone),
                status: InquiryStatus.NEW,
            },
            include: this.getInclude(),
        });

        return this.toResponse(inquiry);
    }

    async findMine(userId: string, query: PaginationQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.inquiry.findMany({
                where: {
                    userId: userId,
                    property: { createdByUserId: { not: null } },
                },
                include: this.getInclude(),
                orderBy: {
                    createdAt: 'desc',
                },
                skip: skip,
                take: limit,
            }),
            this.prisma.inquiry.count({
                where: {
                    userId: userId,
                    property: { createdByUserId: { not: null } },
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

    async findOneMine(userId: string, inquiryId: string) {
        const inquiry = await this.prisma.inquiry.findFirst({
            where: {
                id: inquiryId,
                userId: userId,
                property: { createdByUserId: { not: null } },
            },
            include: this.getInclude(),
        });

        if (!inquiry) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy yêu cầu liên hệ');
        }

        return this.toResponse(inquiry);
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

    private normalizeOptionalText(value?: string) {
        const normalized = value?.trim();
        return normalized || undefined;
    }

    private toResponse(inquiry: any) {
        return {
            id: inquiry.id,
            propertyId: inquiry.propertyId,
            message: inquiry.message,
            contactName: inquiry.contactName,
            contactPhone: inquiry.contactPhone,
            status: inquiry.status,
            createdAt: inquiry.createdAt.toISOString(),
            updatedAt: inquiry.updatedAt.toISOString(),
            property: this.toPropertySummary(inquiry.property),
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
