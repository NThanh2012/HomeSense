import { SourceImportStatus, SourceImportTargetType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';

export class FilterSourceImportDto extends PaginationQueryDto {
    @IsUUID('4', { message: 'Data source id không hợp lệ' })
    @IsOptional()
    dataSourceId?: string;

    @IsEnum(SourceImportTargetType, { message: 'Loại dữ liệu import không hợp lệ' })
    @IsOptional()
    targetType?: SourceImportTargetType;

    @IsEnum(SourceImportStatus, { message: 'Trạng thái import không hợp lệ' })
    @IsOptional()
    status?: SourceImportStatus;
}
