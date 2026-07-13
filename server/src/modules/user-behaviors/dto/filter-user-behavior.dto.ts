import { UserBehaviorEventType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';

export class FilterUserBehaviorDto extends PaginationQueryDto {
    @IsOptional()
    @IsEnum(UserBehaviorEventType, { message: 'Loại hành vi không hợp lệ' })
    eventType?: UserBehaviorEventType;
}
