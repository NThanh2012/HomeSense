import { SourceImportTargetType } from '@prisma/client';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsUUID } from 'class-validator';

export const IMPORTABLE_SOURCE_TARGET_TYPES = [
    SourceImportTargetType.USER_SIGNAL,
    SourceImportTargetType.EXTERNAL_BEHAVIOR,
] as const;

export class ImportJsonDto {
    @IsUUID('4', { message: 'Data source id không hợp lệ' })
    dataSourceId: string;

    @IsIn(IMPORTABLE_SOURCE_TARGET_TYPES, {
        message: 'Chỉ hỗ trợ import tín hiệu người dùng hoặc hành vi ngoài hệ thống',
    })
    targetType: SourceImportTargetType;

    @IsArray({ message: 'Danh sách import phải là mảng' })
    @ArrayMinSize(1, { message: 'Danh sách import không được để trống' })
    @ArrayMaxSize(50, { message: 'Mỗi lần chỉ được import tối đa 50 records' })
    items: Record<string, unknown>[];
}
