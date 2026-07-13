import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page phải là số nguyên' })
    @Min(1, { message: 'Page phải lớn hơn hoặc bằng 1' })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit phải là số nguyên' })
    @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
    @Max(100, { message: 'Limit không được lớn hơn 100' })
    limit?: number = 20;
}
