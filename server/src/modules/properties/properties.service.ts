import { Injectable } from '@nestjs/common';
import { MediaType, Prisma, PropertyStatus } from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { CreatePropertyDto } from './dto/create-property.dto.ts';
import {
    FilterPropertyDto,
    PropertySortBy,
    PropertySortOrder,
} from './dto/filter-property.dto.ts';
import { UpdateMyPropertyDto } from './dto/update-my-property.dto.ts';

type PropertyWriteDto = CreatePropertyDto | UpdateMyPropertyDto;

@Injectable()
export class PropertiesService {
    constructor(private readonly prisma: PrismaService) {}

    async createMine(userId: string, dto: CreatePropertyDto) {
        return this.prisma.$transaction(async (tx) => {
            const locationId = await this.createSubmittedLocation(tx, dto);
            const propertyData = this.buildCreateData(userId, dto, locationId);

            const created = await tx.property.create({
                data: propertyData,
                select: {
                    id: true,
                },
            });

            await this.replaceMedia(tx, created.id, dto.mediaUrls ?? []);

            const property = await tx.property.findUnique({
                where: {
                    id: created.id,
                },
                include: this.getInclude(),
            });

            return this.toResponse(property);
        });
    }

    async findMine(userId: string, query: PaginationQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.property.findMany({
                where: {
                    createdByUserId: userId,
                },
                include: this.getInclude(),
                orderBy: {
                    createdAt: 'desc',
                },
                skip: skip,
                take: limit,
            }),
            this.prisma.property.count({
                where: {
                    createdByUserId: userId,
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

    async findOneMine(userId: string, id: string) {
        const property = await this.prisma.property.findFirst({
            where: {
                id: id,
                createdByUserId: userId,
            },
            include: this.getInclude(),
        });

        if (!property) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy tin đăng của bạn');
        }

        return this.toResponse(property);
    }

    async updateMine(userId: string, id: string, dto: UpdateMyPropertyDto) {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.property.findFirst({
                where: {
                    id: id,
                    createdByUserId: userId,
                },
                select: {
                    id: true,
                    status: true,
                    locationId: true,
                },
            });

            if (!existing) {
                throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy tin đăng của bạn');
            }

            if (
                existing.status === PropertyStatus.PUBLISHED ||
                existing.status === PropertyStatus.ARCHIVED
            ) {
                throw new ApiException(
                    ResponseCode.INVALID_PARAMETER_VALUE,
                    'Tin đã công khai hoặc lưu trữ không thể sửa trực tiếp',
                );
            }

            const locationId = await this.syncSubmittedLocation(tx, dto, existing.locationId);
            const data = this.buildUpdateData(dto);

            if (locationId !== existing.locationId) {
                data.locationId = locationId;
            }

            if (existing.status === PropertyStatus.PENDING_REVIEW) {
                data.status = PropertyStatus.DRAFT;
            }

            await tx.property.update({
                where: {
                    id: id,
                },
                data: data,
            });

            await this.replaceMedia(tx, id, dto.mediaUrls);

            const property = await tx.property.findUnique({
                where: {
                    id: id,
                },
                include: this.getInclude(),
            });

            return this.toResponse(property);
        });
    }

    async submitMine(userId: string, id: string) {
        const property = await this.prisma.property.findFirst({
            where: {
                id: id,
                createdByUserId: userId,
            },
            include: this.getInclude(),
        });

        if (!property) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy tin đăng của bạn');
        }

        if (
            property.status === PropertyStatus.PUBLISHED ||
            property.status === PropertyStatus.ARCHIVED
        ) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Tin đã công khai hoặc lưu trữ không thể gửi duyệt lại',
            );
        }

        if (property.status === PropertyStatus.PENDING_REVIEW) {
            return this.toResponse(property);
        }

        const updated = await this.prisma.property.update({
            where: {
                id: id,
            },
            data: {
                status: PropertyStatus.PENDING_REVIEW,
            },
            include: this.getInclude(),
        });

        return this.toResponse(updated);
    }

    async findAll(query: FilterPropertyDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        this.validateRanges(query);

        const where = this.buildWhere(query);
        const orderBy = this.buildOrderBy(query);

        const [items, total] = await Promise.all([
            this.prisma.property.findMany({
                where: where,
                include: this.getInclude(),
                orderBy: orderBy,
                skip: skip,
                take: limit,
            }),
            this.prisma.property.count({
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
        const property = await this.prisma.property.findFirst({
            where: {
                id: id,
                status: PropertyStatus.PUBLISHED,
                createdByUserId: { not: null },
            },
            include: this.getInclude(),
        });

        if (!property) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy bất động sản');
        }

        return this.toResponse(property);
    }

    private validateRanges(query: FilterPropertyDto) {
        if (
            query.minPrice !== undefined &&
            query.maxPrice !== undefined &&
            query.minPrice > query.maxPrice
        ) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Giá thấp nhất không được lớn hơn giá cao nhất',
            );
        }

        if (
            query.minArea !== undefined &&
            query.maxArea !== undefined &&
            query.minArea > query.maxArea
        ) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Diện tích thấp nhất không được lớn hơn diện tích cao nhất',
            );
        }
    }

    private buildWhere(query: FilterPropertyDto): Prisma.PropertyWhereInput {
        const where: Prisma.PropertyWhereInput = {
            status: PropertyStatus.PUBLISHED,
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
                {
                    location: {
                        province: {
                            contains: query.keyword,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    location: {
                        district: {
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

        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            where.price = {};

            if (query.minPrice !== undefined) {
                where.price.gte = query.minPrice;
            }

            if (query.maxPrice !== undefined) {
                where.price.lte = query.maxPrice;
            }
        }

        if (query.minArea !== undefined || query.maxArea !== undefined) {
            where.area = {};

            if (query.minArea !== undefined) {
                where.area.gte = query.minArea;
            }

            if (query.maxArea !== undefined) {
                where.area.lte = query.maxArea;
            }
        }

        if (query.province || query.district) {
            const location: Prisma.LocationWhereInput = {};

            if (query.province) {
                location.province = {
                    contains: query.province,
                    mode: 'insensitive',
                };
            }

            if (query.district) {
                location.district = {
                    contains: query.district,
                    mode: 'insensitive',
                };
            }

            where.location = location;
        }

        return where;
    }

    private buildOrderBy(query: FilterPropertyDto): Prisma.PropertyOrderByWithRelationInput {
        const sortOrder = query.sortOrder ?? PropertySortOrder.DESC;

        if (query.sortBy === PropertySortBy.PRICE) {
            return {
                price: sortOrder,
            };
        }

        if (query.sortBy === PropertySortBy.AREA) {
            return {
                area: sortOrder,
            };
        }

        if (query.sortBy === PropertySortBy.TITLE) {
            return {
                title: sortOrder,
            };
        }

        return {
            createdAt: sortOrder,
        };
    }

    private buildCreateData(
        userId: string,
        dto: CreatePropertyDto,
        locationId: string | null,
    ): Prisma.PropertyUncheckedCreateInput {
        return {
            title: this.normalizeRequiredText(dto.title, 'Tiêu đề bất động sản không được để trống'),
            description: this.normalizeOptionalText(dto.description) ?? null,
            transactionType: dto.transactionType,
            propertyType: dto.propertyType,
            price: dto.price,
            area: dto.area,
            bedrooms: dto.bedrooms,
            bathrooms: dto.bathrooms,
            furnishingStatus: this.normalizeOptionalText(dto.furnishingStatus) ?? null,
            legalStatus: this.normalizeOptionalText(dto.legalStatus) ?? null,
            direction: this.normalizeOptionalText(dto.direction) ?? null,
            amenities: this.normalizeStringList(dto.amenities),
            latitude: dto.latitude,
            longitude: dto.longitude,
            contactPhone: this.normalizeOptionalText(dto.contactPhone) ?? null,
            status: PropertyStatus.DRAFT,
            sourceName: 'USER_SUBMITTED',
            createdByUserId: userId,
            locationId: locationId,
        };
    }

    private buildUpdateData(dto: PropertyWriteDto): Prisma.PropertyUncheckedUpdateInput {
        const data: Prisma.PropertyUncheckedUpdateInput = {};

        if (dto.title !== undefined) {
            data.title = this.normalizeRequiredText(
                dto.title,
                'Tiêu đề bất động sản không được để trống',
            );
        }

        if (this.hasOwn(dto, 'description')) {
            data.description = this.normalizeOptionalText(dto.description) ?? null;
        }

        if (dto.transactionType !== undefined) {
            data.transactionType = dto.transactionType;
        }

        if (dto.propertyType !== undefined) {
            data.propertyType = dto.propertyType;
        }

        if (dto.price !== undefined) {
            data.price = dto.price;
        }

        if (dto.area !== undefined) {
            data.area = dto.area;
        }

        if (dto.bedrooms !== undefined) {
            data.bedrooms = dto.bedrooms;
        }

        if (dto.bathrooms !== undefined) {
            data.bathrooms = dto.bathrooms;
        }

        if (this.hasOwn(dto, 'furnishingStatus')) {
            data.furnishingStatus = this.normalizeOptionalText(dto.furnishingStatus) ?? null;
        }

        if (this.hasOwn(dto, 'legalStatus')) {
            data.legalStatus = this.normalizeOptionalText(dto.legalStatus) ?? null;
        }

        if (this.hasOwn(dto, 'direction')) {
            data.direction = this.normalizeOptionalText(dto.direction) ?? null;
        }

        if (dto.amenities !== undefined) {
            data.amenities = this.normalizeStringList(dto.amenities);
        }

        if (this.hasOwn(dto, 'contactPhone')) {
            data.contactPhone = this.normalizeOptionalText(dto.contactPhone) ?? null;
        }

        if (dto.latitude !== undefined) {
            data.latitude = dto.latitude;
        }

        if (dto.longitude !== undefined) {
            data.longitude = dto.longitude;
        }

        return data;
    }

    private async createSubmittedLocation(
        tx: Prisma.TransactionClient,
        dto: PropertyWriteDto,
    ): Promise<string | null> {
        const data = this.buildLocationCreateData(dto);

        if (!this.hasMeaningfulLocation(data)) {
            return null;
        }

        const location = await tx.location.create({
            data: data,
            select: {
                id: true,
            },
        });

        return location.id;
    }

    private async syncSubmittedLocation(
        tx: Prisma.TransactionClient,
        dto: PropertyWriteDto,
        currentLocationId: string | null,
    ): Promise<string | null> {
        if (!this.hasLocationPatch(dto)) {
            return currentLocationId;
        }

        if (currentLocationId) {
            await tx.location.update({
                where: {
                    id: currentLocationId,
                },
                data: this.buildLocationUpdateData(dto),
            });

            return currentLocationId;
        }

        return this.createSubmittedLocation(tx, dto);
    }

    private buildLocationCreateData(dto: PropertyWriteDto): Prisma.LocationCreateInput {
        return {
            province: this.normalizeOptionalText(dto.province) ?? null,
            district: this.normalizeOptionalText(dto.district) ?? null,
            ward: this.normalizeOptionalText(dto.ward) ?? null,
            street: this.normalizeOptionalText(dto.street) ?? null,
            rawAddress: this.normalizeOptionalText(dto.rawAddress) ?? null,
            latitude: dto.latitude ?? null,
            longitude: dto.longitude ?? null,
        };
    }

    private buildLocationUpdateData(dto: PropertyWriteDto): Prisma.LocationUpdateInput {
        const data: Prisma.LocationUpdateInput = {};

        if (this.hasOwn(dto, 'province')) {
            data.province = this.normalizeOptionalText(dto.province) ?? null;
        }

        if (this.hasOwn(dto, 'district')) {
            data.district = this.normalizeOptionalText(dto.district) ?? null;
        }

        if (this.hasOwn(dto, 'ward')) {
            data.ward = this.normalizeOptionalText(dto.ward) ?? null;
        }

        if (this.hasOwn(dto, 'street')) {
            data.street = this.normalizeOptionalText(dto.street) ?? null;
        }

        if (this.hasOwn(dto, 'rawAddress')) {
            data.rawAddress = this.normalizeOptionalText(dto.rawAddress) ?? null;
        }

        if (dto.latitude !== undefined) {
            data.latitude = dto.latitude;
        }

        if (dto.longitude !== undefined) {
            data.longitude = dto.longitude;
        }

        return data;
    }

    private hasLocationPatch(dto: PropertyWriteDto) {
        return (
            this.hasOwn(dto, 'province') ||
            this.hasOwn(dto, 'district') ||
            this.hasOwn(dto, 'ward') ||
            this.hasOwn(dto, 'street') ||
            this.hasOwn(dto, 'rawAddress') ||
            dto.latitude !== undefined ||
            dto.longitude !== undefined
        );
    }

    private hasMeaningfulLocation(data: Prisma.LocationCreateInput) {
        return Object.values(data).some((value) => value !== null && value !== undefined);
    }

    private async replaceMedia(
        tx: Prisma.TransactionClient,
        propertyId: string,
        mediaUrls?: string[],
    ) {
        if (mediaUrls === undefined) {
            return;
        }

        const urls = this.normalizeStringList(mediaUrls);

        await tx.propertyMedia.deleteMany({
            where: {
                propertyId: propertyId,
            },
        });

        if (urls.length < 1) {
            return;
        }

        await tx.propertyMedia.createMany({
            data: urls.map((url, index) => ({
                propertyId: propertyId,
                url: url,
                type: MediaType.IMAGE,
                sortOrder: index,
            })),
        });
    }

    private getInclude() {
        return {
            location: true,
            media: {
                orderBy: {
                    sortOrder: 'asc' as const,
                },
            },
            nearbyPlaces: {
                orderBy: { distanceKm: 'asc' as const },
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

    private normalizeRequiredText(value: string | undefined, message: string) {
        const normalized = value?.trim();

        if (!normalized) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, message);
        }

        return normalized;
    }

    private normalizeOptionalText(value?: string) {
        const normalized = value?.trim();
        return normalized || undefined;
    }

    private normalizeStringList(values?: string[]) {
        const normalized = (values ?? [])
            .map((value) => value.trim())
            .filter(Boolean);

        return Array.from(new Set(normalized));
    }

    private hasOwn<T extends object>(obj: T, key: keyof T) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    private toResponse(property: any) {
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
            nearbyPlaces: property.nearbyPlaces ?? [],
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
}
