import { UserBehaviorEventType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserBehaviorDto {
    @IsNotEmpty({ message: 'Loại hành vi không được để trống' })
    @IsEnum(UserBehaviorEventType, { message: 'Loại hành vi không hợp lệ' })
    eventType: UserBehaviorEventType;

    @IsOptional()
    @IsString({ message: 'Bất động sản không hợp lệ' })
    propertyId?: string;

    @IsOptional()
    @IsString({ message: 'Nhu cầu không hợp lệ' })
    demandId?: string;

    @IsOptional()
    @IsString({ message: 'Kết quả gợi ý không hợp lệ' })
    matchId?: string;

    @IsOptional()
    @IsString({ message: 'Từ khóa không hợp lệ' })
    @MaxLength(200, { message: 'Từ khóa không được quá 200 ký tự' })
    keyword?: string;

    @IsOptional()
    @IsObject({ message: 'Bộ lọc phải là object' })
    filters?: Record<string, unknown>;

    @IsOptional()
    @IsObject({ message: 'Metadata phải là object' })
    metadata?: Record<string, unknown>;

    @IsOptional()
    @IsString({ message: 'Event key không hợp lệ' })
    @MaxLength(160, { message: 'Event key không được quá 160 ký tự' })
    eventKey?: string;
}
