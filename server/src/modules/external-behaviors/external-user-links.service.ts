import { Injectable } from '@nestjs/common';
import { DataPermissionType, DataSourceType, Prisma } from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { CreateExternalUserLinkDto } from './dto/create-external-user-link.dto.ts';
import { FilterExternalUserLinkDto } from './dto/filter-external-user-link.dto.ts';
import { UpdateExternalUserLinkStatusDto } from './dto/update-external-user-link-status.dto.ts';
import {
    EXTERNAL_BEHAVIOR_SOURCE_POLICY_MESSAGE,
    PRODUCTION_EXTERNAL_BEHAVIOR_PERMISSION_TYPES,
    PRODUCTION_EXTERNAL_BEHAVIOR_SOURCE_TYPES,
    isExternalBehaviorSourceAllowed,
} from '../../shared/utils/external-behavior-source-policy.util.ts';

@Injectable()
export class ExternalUserLinksService {
    constructor(private readonly prisma: PrismaService) {}

    async create(adminUserId: string, dto: CreateExternalUserLinkDto) {
        await this.assertAuthorizedSource(dto.dataSourceId);
        await this.assertUserExists(dto.userId);

        return this.prisma.externalUserLink.upsert({
            where: {
                dataSourceId_externalUserRef: {
                    dataSourceId: dto.dataSourceId,
                    externalUserRef: dto.externalUserRef.trim(),
                },
            },
            create: {
                dataSourceId: dto.dataSourceId,
                externalUserRef: dto.externalUserRef.trim(),
                userId: dto.userId,
                linkedByUserId: adminUserId,
                isActive: true,
            },
            update: {
                userId: dto.userId,
                linkedByUserId: adminUserId,
                isActive: true,
            },
            include: this.getInclude(),
        });
    }

    async findAll(query: FilterExternalUserLinkDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where: Prisma.ExternalUserLinkWhereInput = {};

        if (query.dataSourceId) where.dataSourceId = query.dataSourceId;
        if (query.userId) where.userId = query.userId;
        if (query.externalUserRef) {
            where.externalUserRef = { contains: query.externalUserRef, mode: 'insensitive' };
        }
        if (query.isActive !== undefined) where.isActive = query.isActive;

        const [items, total] = await Promise.all([
            this.prisma.externalUserLink.findMany({
                where: where,
                include: this.getInclude(),
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.externalUserLink.count({ where: where }),
        ]);

        return buildPaginatedResult(items, page, limit, total);
    }

    async updateStatus(id: string, dto: UpdateExternalUserLinkStatusDto) {
        const existing = await this.prisma.externalUserLink.findUnique({ where: { id: id } });
        if (!existing) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy liên kết external user');
        }

        return this.prisma.externalUserLink.update({
            where: { id: id },
            data: { isActive: dto.isActive },
            include: this.getInclude(),
        });
    }

    findActiveForUser(userId: string) {
        return this.prisma.externalUserLink.findMany({
            where: {
                userId: userId,
                isActive: true,
                dataSource: {
                    isActive: true,
                    OR: [
                        {
                            sourceType: DataSourceType.DEV_SYNTHETIC,
                            permissionType: DataPermissionType.DEV_SYNTHETIC,
                        },
                        {
                            sourceType: {
                                in: [...PRODUCTION_EXTERNAL_BEHAVIOR_SOURCE_TYPES],
                            },
                            permissionType: {
                                in: [...PRODUCTION_EXTERNAL_BEHAVIOR_PERMISSION_TYPES],
                            },
                        },
                    ],
                },
            },
            select: {
                dataSourceId: true,
                externalUserRef: true,
            },
        });
    }

    private async assertAuthorizedSource(dataSourceId: string) {
        const source = await this.prisma.dataSource.findUnique({ where: { id: dataSourceId } });
        if (!source) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy nguồn dữ liệu');
        }
        if (
            !source.isActive ||
            !isExternalBehaviorSourceAllowed(source.sourceType, source.permissionType)
        ) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                EXTERNAL_BEHAVIOR_SOURCE_POLICY_MESSAGE,
            );
        }
    }

    private async assertUserExists(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!user) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy tài khoản người dùng');
        }
    }

    private getInclude() {
        return {
            dataSource: true,
            user: {
                select: { id: true, email: true, fullName: true, role: true, status: true },
            },
            linkedBy: {
                select: { id: true, email: true, fullName: true },
            },
        };
    }
}
