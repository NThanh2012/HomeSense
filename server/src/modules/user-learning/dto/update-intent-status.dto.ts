import { IsEnum } from 'class-validator';
import { RealEstateIntentStatus } from '@prisma/client';

export class UpdateIntentStatusDto {
    @IsEnum(RealEstateIntentStatus, { message: 'Trạng thái nhu cầu BĐS không hợp lệ' })
    status!: RealEstateIntentStatus;
}
