import { DemandMatchStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateMatchStatusDto {
    @IsEnum(DemandMatchStatus, { message: 'Trạng thái match không hợp lệ' })
    status: DemandMatchStatus;
}
