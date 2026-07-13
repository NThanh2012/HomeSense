import { DataPermissionType, DataSourceType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';

export class FilterDataSourceDto extends PaginationQueryDto {
    @IsString()
    @IsOptional()
    keyword?: string;

    @IsEnum(DataSourceType, { message: 'Loại nguồn dữ liệu không hợp lệ' })
    @IsOptional()
    sourceType?: DataSourceType;

    @IsEnum(DataPermissionType, { message: 'Loại quyền sử dụng dữ liệu không hợp lệ' })
    @IsOptional()
    permissionType?: DataPermissionType;

    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean({ message: 'Trạng thái nguồn dữ liệu không hợp lệ' })
    @IsOptional()
    isActive?: boolean;
}
