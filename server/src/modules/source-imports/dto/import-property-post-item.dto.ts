import {
    ArrayMaxSize,
    IsArray,
    IsDateString,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';

export class ImportPropertyPostItemDto {
    @IsString()
    @IsOptional()
    externalId?: string;

    @IsString()
    @IsOptional()
    sourceUrl?: string;

    @IsString()
    @IsNotEmpty({ message: 'Nội dung bài đăng không được để trống' })
    content: string;

    @IsString()
    @IsOptional()
    authorName?: string;

    @IsString()
    @IsOptional()
    authorPhone?: string;

    @IsArray({ message: 'Danh sách media phải là mảng' })
    @ArrayMaxSize(20, { message: 'Danh sách media không được quá 20 mục' })
    @IsString({ each: true, message: 'Media URL phải là chuỗi' })
    @IsOptional()
    mediaUrls?: string[];

    @IsDateString({}, { message: 'Thời gian thu thập không đúng định dạng' })
    @IsOptional()
    capturedAt?: string;

    @IsObject({ message: 'Metadata phải là object' })
    @IsOptional()
    metadata?: Record<string, unknown>;
}
