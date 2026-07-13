import { IsEnum, IsOptional } from 'class-validator';
import { PropertyStatus } from '@prisma/client';
import { FilterPropertyDto } from '../../properties/dto/filter-property.dto.ts';

export class AdminFilterPropertiesDto extends FilterPropertyDto {
    @IsEnum(PropertyStatus, { message: 'Trạng thái bất động sản không hợp lệ' })
    @IsOptional()
    status?: PropertyStatus;
}
