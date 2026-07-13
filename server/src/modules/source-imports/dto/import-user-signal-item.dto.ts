import { IsDateString, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ImportUserSignalItemDto {
    @IsString()
    @IsOptional()
    externalId?: string;

    @IsString()
    @IsOptional()
    externalUserRef?: string;

    @IsString()
    @IsOptional()
    sourceUrl?: string;

    @IsString()
    @IsNotEmpty({ message: 'Nội dung tín hiệu không được để trống' })
    content: string;

    @IsString()
    @IsOptional()
    authorName?: string;

    @IsString()
    @IsOptional()
    authorPhone?: string;

    @IsDateString({}, { message: 'Thời gian thu thập không đúng định dạng' })
    @IsOptional()
    capturedAt?: string;

    @IsObject({ message: 'Metadata phải là object' })
    @IsOptional()
    metadata?: Record<string, unknown>;
}
