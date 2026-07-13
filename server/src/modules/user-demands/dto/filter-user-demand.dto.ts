import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DemandType, PropertyType, UserDemandStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';

export class FilterUserDemandDto extends PaginationQueryDto {
    @IsEnum(DemandType, { message: 'Loại nhu cầu không hợp lệ' })
    @IsOptional()
    demandType?: DemandType;

    @IsEnum(PropertyType, { message: 'Loại bất động sản không hợp lệ' })
    @IsOptional()
    propertyType?: PropertyType;

    @IsEnum(UserDemandStatus, { message: 'Trạng thái nhu cầu không hợp lệ' })
    @IsOptional()
    status?: UserDemandStatus;

    @IsString()
    @IsOptional()
    province?: string;

    @IsString()
    @IsOptional()
    district?: string;

    @IsString()
    @IsOptional()
    keyword?: string;
}
