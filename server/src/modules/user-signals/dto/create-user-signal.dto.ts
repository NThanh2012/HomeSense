import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { RawUserSignalConsentType } from '../schemas/raw-user-signal.schema.ts';

export class CreateUserSignalDto {
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
    @IsOptional()
    externalUserRef?: string;

    @IsString()
    @IsNotEmpty({ message: 'Nội dung tín hiệu không được để trống' })
    content: string;

    @IsString()
    @IsOptional()
    authorName?: string;

    @IsString()
    @IsOptional()
    authorPhone?: string;

    @IsString()
    @IsOptional()
    authorProfileUrl?: string;

    @IsDateString({}, { message: 'Thời gian thu thập không đúng định dạng' })
    @IsOptional()
    capturedAt?: string;

    @IsObject({ message: 'Metadata phải là object' })
    @IsOptional()
    metadata?: Record<string, unknown>;

    @IsEnum(RawUserSignalConsentType, { message: 'Loại quyền sử dụng dữ liệu không hợp lệ' })
    consentType: RawUserSignalConsentType;

    @IsString()
    @IsOptional()
    permissionNote?: string;
}
