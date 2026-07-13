import { Injectable } from '@nestjs/common';
import { DataPermissionType, DataSourceType, Prisma } from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { CreateDataSourceDto } from './dto/create-data-source.dto.ts';
import { FilterDataSourceDto } from './dto/filter-data-source.dto.ts';
import { UpdateDataSourceStatusDto } from './dto/update-data-source-status.dto.ts';
import { UpdateDataSourceDto } from './dto/update-data-source.dto.ts';

@Injectable()
export class DataSourcesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId: string, dto: CreateDataSourceDto) {
        this.assertPermissionPair(dto.sourceType, dto.permissionType);

        return this.prisma.dataSource.create({
            data: {
                ...dto,
                isActive: false,
                createdByUserId: userId,
            },
        });
    }

    async findAll(query: FilterDataSourceDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = this.buildWhere(query);
        const [items, total] = await Promise.all([
            this.prisma.dataSource.findMany({
                where: where,
                include: {
                    createdBy: {
                        select: { id: true, email: true, fullName: true },
                    },
                    _count: {
                        select: { importBatches: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.dataSource.count({ where: where }),
        ]);

        return buildPaginatedResult(items, page, limit, total);
    }

    async findOne(id: string) {
        const source = await this.prisma.dataSource.findUnique({
            where: { id: id },
            include: {
                createdBy: {
                    select: { id: true, email: true, fullName: true },
                },
                _count: {
                    select: { importBatches: true },
                },
            },
        });

        if (!source) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy nguồn dữ liệu');
        }

        return source;
    }

    async update(id: string, dto: UpdateDataSourceDto) {
        const existing = await this.findOne(id);
        const permissionType = dto.permissionType ?? existing.permissionType;
        this.assertPermissionPair(existing.sourceType, permissionType);

        return this.prisma.dataSource.update({
            where: { id: id },
            data: {
                ...dto,
                isActive:
                    permissionType === DataPermissionType.UNKNOWN ? false : existing.isActive,
            },
        });
    }

    async updateStatus(id: string, dto: UpdateDataSourceStatusDto) {
        const existing = await this.findOne(id);

        if (dto.isActive) {
            this.assertPermissionAllowed(existing);
        }

        return this.prisma.dataSource.update({
            where: { id: id },
            data: { isActive: dto.isActive },
        });
    }

    async findActiveForImport(id: string) {
        const source = await this.findOne(id);
        this.assertCanImport(source);
        return source;
    }

    private assertCanImport(source: {
        isActive: boolean;
        sourceType: DataSourceType;
        permissionType: DataPermissionType;
    }) {
        if (!source.isActive) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Nguồn dữ liệu chưa được kích hoạt',
            );
        }
        this.assertPermissionAllowed(source);
    }

    private assertPermissionAllowed(source: {
        sourceType: DataSourceType;
        permissionType: DataPermissionType;
    }) {
        if (source.permissionType === DataPermissionType.UNKNOWN) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Nguồn dữ liệu chưa có quyền sử dụng hợp lệ',
            );
        }
        this.assertPermissionPair(source.sourceType, source.permissionType);
    }

    private assertPermissionPair(sourceType: DataSourceType, permissionType: DataPermissionType) {
        const sourceIsDev = sourceType === DataSourceType.DEV_SYNTHETIC;
        const permissionIsDev = permissionType === DataPermissionType.DEV_SYNTHETIC;

        if (sourceIsDev !== permissionIsDev) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Nguồn DEV_SYNTHETIC phải dùng quyền DEV_SYNTHETIC',
            );
        }
    }

    private buildWhere(query: FilterDataSourceDto): Prisma.DataSourceWhereInput {
        const where: Prisma.DataSourceWhereInput = {};

        if (query.sourceType) where.sourceType = query.sourceType;
        if (query.permissionType) where.permissionType = query.permissionType;
        if (query.isActive !== undefined) where.isActive = query.isActive;
        if (query.keyword) {
            where.OR = [
                { name: { contains: query.keyword, mode: 'insensitive' } },
                { platform: { contains: query.keyword, mode: 'insensitive' } },
                { baseUrl: { contains: query.keyword, mode: 'insensitive' } },
                { permissionNote: { contains: query.keyword, mode: 'insensitive' } },
            ];
        }

        return where;
    }
}
