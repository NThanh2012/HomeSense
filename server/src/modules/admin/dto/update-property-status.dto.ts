import { IsEnum, IsNotEmpty } from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class UpdatePropertyStatusDto {
    @IsNotEmpty({ message: 'Trạng thái bất động sản không được để trống' })
    @IsEnum(PropertyStatus, { message: 'Trạng thái bất động sản không hợp lệ' })
    status: PropertyStatus;
}
