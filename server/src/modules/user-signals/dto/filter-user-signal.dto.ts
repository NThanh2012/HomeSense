import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';
import {
    RawUserSignalConsentType,
    RawUserSignalStatus,
} from '../schemas/raw-user-signal.schema.ts';

export class FilterUserSignalDto extends PaginationQueryDto {
    @IsEnum(RawUserSignalStatus, { message: 'Trạng thái tín hiệu không hợp lệ' })
    @IsOptional()
    status?: RawUserSignalStatus;

    @IsEnum(RawUserSignalConsentType, { message: 'Loại quyền sử dụng dữ liệu không hợp lệ' })
    @IsOptional()
    consentType?: RawUserSignalConsentType;

    @IsString()
    @IsOptional()
    sourceType?: string;

    @IsString()
    @IsOptional()
    keyword?: string;
}
