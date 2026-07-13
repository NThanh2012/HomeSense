import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { FilterUserDemandDto } from './dto/filter-user-demand.dto.ts';
import { UpdateUserDemandStatusDto } from './dto/update-user-demand-status.dto.ts';

@Injectable()
export class UserDemandsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: FilterUserDemandDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = this.buildWhere(query);

        const [items, total] = await Promise.all([
            this.prisma.userDemand.findMany({
                where: where,
                include: this.getInclude(),
                orderBy: {
                    createdAt: 'desc',
                },
                skip: skip,
                take: limit,
            }),
            this.prisma.userDemand.count({
                where: where,
            }),
        ]);

        return buildPaginatedResult(
            items.map((item) => this.toResponse(item)),
            page,
            limit,
            total,
        );
    }

    async findOne(id: string) {
        const demand = await this.prisma.userDemand.findUnique({
            where: {
                id: id,
            },
            include: this.getInclude(),
        });

        if (!demand) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy nhu cầu người dùng');
        }

        return this.toResponse(demand);
    }

    async updateStatus(id: string, dto: UpdateUserDemandStatusDto) {
        await this.findOne(id);

        const demand = await this.prisma.userDemand.update({
            where: {
                id: id,
            },
            data: {
                status: dto.status,
            },
            include: this.getInclude(),
        });

        return this.toResponse(demand);
    }

    private buildWhere(query: FilterUserDemandDto): Prisma.UserDemandWhereInput {
        const where: Prisma.UserDemandWhereInput = {};

        if (query.demandType) {
            where.demandType = query.demandType;
        }

        if (query.propertyType) {
            where.propertyTypes = {
                has: query.propertyType,
            };
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.province) {
            where.province = {
                contains: query.province,
                mode: 'insensitive',
            };
        }

        if (query.district) {
            where.district = {
                contains: query.district,
                mode: 'insensitive',
            };
        }

        if (query.keyword) {
            where.OR = [
                {
                    rawLocation: {
                        contains: query.keyword,
                        mode: 'insensitive',
                    },
                },
                {
                    externalUserRef: {
                        contains: query.keyword,
                        mode: 'insensitive',
                    },
                },
                {
                    contactPhone: {
                        contains: query.keyword,
                        mode: 'insensitive',
                    },
                },
                {
                    keywords: {
                        has: query.keyword,
                    },
                },
            ];
        }

        return where;
    }

    private getInclude() {
        return {
            user: true,
            signals: {
                orderBy: {
                    createdAt: 'desc' as const,
                },
            },
            analyses: {
                orderBy: {
                    createdAt: 'desc' as const,
                },
                take: 1,
            },
        };
    }

    private toResponse(demand: any) {
        const latestAnalysis = demand.analyses?.[0] ?? null;

        return {
            id: demand.id,
            userId: demand.userId,
            externalUserRef: demand.externalUserRef,
            demandType: demand.demandType,
            propertyTypes: demand.propertyTypes ?? [],
            minPrice: demand.minPrice === null ? null : Number(demand.minPrice),
            maxPrice: demand.maxPrice === null ? null : Number(demand.maxPrice),
            minArea: demand.minArea,
            maxArea: demand.maxArea,
            province: demand.province,
            district: demand.district,
            ward: demand.ward,
            rawLocation: demand.rawLocation,
            keywords: demand.keywords ?? [],
            contactPhone: demand.contactPhone,
            sourceConfidence: demand.sourceConfidence,
            status: demand.status,
            user: demand.user ? this.toUserSummary(demand.user) : null,
            signals: demand.signals ?? [],
            latestAnalysis: latestAnalysis ? this.toAnalysisResponse(latestAnalysis) : null,
            createdAt: demand.createdAt.toISOString(),
            updatedAt: demand.updatedAt.toISOString(),
        };
    }

    private toAnalysisResponse(analysis: any) {
        return {
            ...analysis,
            extractedMinPrice:
                analysis.extractedMinPrice === null ? null : Number(analysis.extractedMinPrice),
            extractedMaxPrice:
                analysis.extractedMaxPrice === null ? null : Number(analysis.extractedMaxPrice),
            createdAt: analysis.createdAt.toISOString(),
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
}
