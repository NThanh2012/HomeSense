import { IsEnum, IsNotEmpty } from 'class-validator';
import { InquiryStatus } from '@prisma/client';

export class UpdateInquiryStatusDto {
    @IsNotEmpty({ message: 'Trạng thái yêu cầu liên hệ không được để trống' })
    @IsEnum(InquiryStatus, { message: 'Trạng thái yêu cầu liên hệ không hợp lệ' })
    status: InquiryStatus;
}
