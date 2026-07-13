import { IsBoolean } from 'class-validator';

export class UpdateExternalUserLinkStatusDto {
    @IsBoolean({ message: 'Trạng thái liên kết không hợp lệ' })
    isActive: boolean;
}
