import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';
import { RawExternalBehaviorStatus } from '../schemas/raw-external-behavior.schema.ts';

export class FilterExternalBehaviorDto extends PaginationQueryDto {
    @IsString({ message: 'Data source id không hợp lệ' })
    @IsOptional()
    dataSourceId?: string;

    @IsString({ message: 'External user ref không hợp lệ' })
    @IsOptional()
    externalUserRef?: string;

    @IsEnum(RawExternalBehaviorStatus, { message: 'Trạng thái external behavior không hợp lệ' })
    @IsOptional()
    status?: RawExternalBehaviorStatus;
}
