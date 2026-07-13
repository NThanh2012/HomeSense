import { DataPermissionType, DataSourceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateDataSourceDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên nguồn dữ liệu không được để trống' })
    @MaxLength(160, { message: 'Tên nguồn dữ liệu không được quá 160 ký tự' })
    name: string;

    @IsEnum(DataSourceType, { message: 'Loại nguồn dữ liệu không hợp lệ' })
    sourceType: DataSourceType;

    @IsString()
    @IsOptional()
    @MaxLength(80, { message: 'Tên nền tảng không được quá 80 ký tự' })
    platform?: string;

    @IsUrl({}, { message: 'Base URL không hợp lệ' })
    @IsOptional()
    baseUrl?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Mô tả không được quá 500 ký tự' })
    description?: string;

    @IsEnum(DataPermissionType, { message: 'Loại quyền sử dụng dữ liệu không hợp lệ' })
    permissionType: DataPermissionType;

    @IsString()
    @IsNotEmpty({ message: 'Ghi chú quyền sử dụng không được để trống' })
    @MaxLength(1000, { message: 'Ghi chú quyền sử dụng không được quá 1000 ký tự' })
    permissionNote: string;
}
