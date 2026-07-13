import {
    ArrayMaxSize,
    IsArray,
    IsDateString,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateRawPostDto {
    @IsString()
    @IsNotEmpty({ message: 'Loại nguồn không được để trống' })
    @MaxLength(50, { message: 'Loại nguồn không được quá 50 ký tự' })
    sourceType: string;

    @IsString()
    @IsNotEmpty({ message: 'Tên nguồn không được để trống' })
    @MaxLength(120, { message: 'Tên nguồn không được quá 120 ký tự' })
    sourceName: string;

    @IsString()
    @IsOptional()
    sourceUrl?: string;

    @IsString()
    @IsOptional()
    externalId?: string;

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
