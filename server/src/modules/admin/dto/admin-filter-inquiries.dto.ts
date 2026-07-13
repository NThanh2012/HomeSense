import { IsEnum, IsOptional } from 'class-validator';
import { InquiryStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';

export class AdminFilterInquiriesDto extends PaginationQueryDto {
    @IsEnum(InquiryStatus, { message: 'Trạng thái yêu cầu liên hệ không hợp lệ' })
    @IsOptional()
    status?: InquiryStatus;
}
