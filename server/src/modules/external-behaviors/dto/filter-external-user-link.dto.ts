import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';

export class FilterExternalUserLinkDto extends PaginationQueryDto {
    @IsUUID('4', { message: 'Data source id không hợp lệ' })
    @IsOptional()
    dataSourceId?: string;

    @IsUUID('4', { message: 'User id không hợp lệ' })
    @IsOptional()
    userId?: string;

    @IsString({ message: 'External user ref không hợp lệ' })
    @IsOptional()
    externalUserRef?: string;

    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean({ message: 'Trạng thái liên kết không hợp lệ' })
    @IsOptional()
    isActive?: boolean;
}
