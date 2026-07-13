import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { PropertyType, TransactionType } from '@prisma/client';

export class CreatePropertyDto {
    @IsString()
    @IsNotEmpty({ message: 'Tiêu đề bất động sản không được để trống' })
    @MaxLength(200, { message: 'Tiêu đề bất động sản không được quá 200 ký tự' })
    title: string;

    @IsString()
    @IsOptional()
    @MaxLength(5000, { message: 'Mô tả bất động sản không được quá 5000 ký tự' })
    description?: string;

    @IsEnum(TransactionType, { message: 'Loại giao dịch không hợp lệ' })
    transactionType: TransactionType;

    @IsEnum(PropertyType, { message: 'Loại bất động sản không hợp lệ' })
    propertyType: PropertyType;

    @Type(() => Number)
    @IsNumber({}, { message: 'Giá bất động sản phải là số' })
    @Min(0, { message: 'Giá bất động sản không được âm' })
    @IsOptional()
    price?: number;

    @Type(() => Number)
    @IsNumber({}, { message: 'Diện tích phải là số' })
    @Min(0, { message: 'Diện tích không được âm' })
    @IsOptional()
    area?: number;

    @Type(() => Number)
    @IsInt({ message: 'Số phòng ngủ phải là số nguyên' })
    @Min(0, { message: 'Số phòng ngủ không được âm' })
    @IsOptional()
    bedrooms?: number;

    @Type(() => Number)
    @IsInt({ message: 'Số phòng tắm phải là số nguyên' })
    @Min(0, { message: 'Số phòng tắm không được âm' })
    @IsOptional()
    bathrooms?: number;

    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'Tình trạng nội thất không được quá 100 ký tự' })
    furnishingStatus?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'Pháp lý không được quá 100 ký tự' })
    legalStatus?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100, { message: 'Hướng không được quá 100 ký tự' })
    direction?: string;

    @IsArray({ message: 'Tiện ích phải là danh sách' })
    @IsString({ each: true, message: 'Mỗi tiện ích phải là chuỗi' })
    @MaxLength(100, { each: true, message: 'Mỗi tiện ích không được quá 100 ký tự' })
    @IsOptional()
    amenities?: string[];

    @IsString()
    @IsOptional()
    @MaxLength(40, { message: 'Số điện thoại liên hệ không được quá 40 ký tự' })
    contactPhone?: string;

    @IsArray({ message: 'Media phải là danh sách URL' })
    @IsString({ each: true, message: 'Mỗi media URL phải là chuỗi' })
    @MaxLength(500, { each: true, message: 'Mỗi media URL không được quá 500 ký tự' })
    @IsOptional()
    mediaUrls?: string[];

    @IsString()
    @IsOptional()
    @MaxLength(120, { message: 'Tỉnh/thành không được quá 120 ký tự' })
    province?: string;

    @IsString()
    @IsOptional()
    @MaxLength(120, { message: 'Quận/huyện không được quá 120 ký tự' })
    district?: string;

    @IsString()
    @IsOptional()
    @MaxLength(120, { message: 'Phường/xã không được quá 120 ký tự' })
    ward?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200, { message: 'Tên đường không được quá 200 ký tự' })
    street?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Địa chỉ không được quá 500 ký tự' })
    rawAddress?: string;

    @Type(() => Number)
    @IsNumber({}, { message: 'Vĩ độ phải là số' })
    @Min(-90, { message: 'Vĩ độ không hợp lệ' })
    @Max(90, { message: 'Vĩ độ không hợp lệ' })
    @IsOptional()
    latitude?: number;

    @Type(() => Number)
    @IsNumber({}, { message: 'Kinh độ phải là số' })
    @Min(-180, { message: 'Kinh độ không hợp lệ' })
    @Max(180, { message: 'Kinh độ không hợp lệ' })
    @IsOptional()
    longitude?: number;
}
