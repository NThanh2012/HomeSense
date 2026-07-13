import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PropertyType, TransactionType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';

export enum PropertySortBy {
    CREATED_AT = 'createdAt',
    PRICE = 'price',
    AREA = 'area',
    TITLE = 'title',
}

export enum PropertySortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class FilterPropertyDto extends PaginationQueryDto {
    @IsString()
    @IsOptional()
    keyword?: string;

    @IsEnum(TransactionType, { message: 'Loại giao dịch không hợp lệ' })
    @IsOptional()
    transactionType?: TransactionType;

    @IsEnum(PropertyType, { message: 'Loại bất động sản không hợp lệ' })
    @IsOptional()
    propertyType?: PropertyType;

    @Type(() => Number)
    @IsNumber({}, { message: 'Giá thấp nhất phải là số' })
    @Min(0, { message: 'Giá thấp nhất không được âm' })
    @IsOptional()
    minPrice?: number;

    @Type(() => Number)
    @IsNumber({}, { message: 'Giá cao nhất phải là số' })
    @Max(1_000_000_000_000, { message: 'Giá cao nhất quá lớn' })
    @IsOptional()
    maxPrice?: number;

    @Type(() => Number)
    @IsNumber({}, { message: 'Diện tích thấp nhất phải là số' })
    @Min(0, { message: 'Diện tích thấp nhất không được âm' })
    @IsOptional()
    minArea?: number;

    @Type(() => Number)
    @IsNumber({}, { message: 'Diện tích cao nhất phải là số' })
    @Min(0, { message: 'Diện tích cao nhất không được âm' })
    @IsOptional()
    maxArea?: number;

    @IsString()
    @IsOptional()
    province?: string;

    @IsString()
    @IsOptional()
    district?: string;

    @IsEnum(PropertySortBy, { message: 'Trường sắp xếp không hợp lệ' })
    @IsOptional()
    sortBy?: PropertySortBy;

    @IsEnum(PropertySortOrder, { message: 'Thứ tự sắp xếp không hợp lệ' })
    @IsOptional()
    sortOrder?: PropertySortOrder;
}
