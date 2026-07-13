import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LearningJobStatus, LearningJobType } from '@prisma/client';

export class FilterLearningJobDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Trang phải là số nguyên' })
    @Min(1, { message: 'Trang phải lớn hơn hoặc bằng 1' })
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Giới hạn phải là số nguyên' })
    @Min(1, { message: 'Giới hạn phải lớn hơn hoặc bằng 1' })
    @Max(100, { message: 'Giới hạn tối đa là 100' })
    limit?: number;

    @IsOptional()
    @IsEnum(LearningJobType, { message: 'Loại learning job không hợp lệ' })
    type?: LearningJobType;

    @IsOptional()
    @IsEnum(LearningJobStatus, { message: 'Trạng thái learning job không hợp lệ' })
    status?: LearningJobStatus;

    @IsOptional()
    @IsString({ message: 'User id phải là chuỗi' })
    userId?: string;
}
