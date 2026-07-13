import { IsEnum } from 'class-validator';
import { UserDemandStatus } from '@prisma/client';

export class UpdateUserDemandStatusDto {
    @IsEnum(UserDemandStatus, { message: 'Trạng thái nhu cầu không hợp lệ' })
    status: UserDemandStatus;
}
