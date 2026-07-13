import { DataPermissionType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateDataSourceDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên nguồn dữ liệu không được để trống' })
    @MaxLength(160, { message: 'Tên nguồn dữ liệu không được quá 160 ký tự' })
    @IsOptional()
    name?: string;

    @IsString()
    @MaxLength(80, { message: 'Tên nền tảng không được quá 80 ký tự' })
    @IsOptional()
    platform?: string;

    @IsUrl({}, { message: 'Base URL không hợp lệ' })
    @IsOptional()
    baseUrl?: string;

    @IsString()
    @MaxLength(500, { message: 'Mô tả không được quá 500 ký tự' })
    @IsOptional()
    description?: string;

    @IsEnum(DataPermissionType, { message: 'Loại quyền sử dụng dữ liệu không hợp lệ' })
    @IsOptional()
    permissionType?: DataPermissionType;

    @IsString()
    @IsNotEmpty({ message: 'Ghi chú quyền sử dụng không được để trống' })
    @MaxLength(1000, { message: 'Ghi chú quyền sử dụng không được quá 1000 ký tự' })
    @IsOptional()
    permissionNote?: string;
}
