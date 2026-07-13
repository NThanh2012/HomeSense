import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DemandMatchStatus } from '@prisma/client';

export class FilterDemandMatchesDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(100)
    minScore?: number;

    @IsOptional()
    @IsEnum(DemandMatchStatus, { message: 'Trạng thái match không hợp lệ' })
    status?: DemandMatchStatus;
}
