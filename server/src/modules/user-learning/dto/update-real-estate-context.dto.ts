import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { LocationAnchorType } from '@prisma/client';

export class UserLocationAnchorDto {
    @IsEnum(LocationAnchorType, { message: 'Loại địa điểm không hợp lệ' })
    anchorType!: LocationAnchorType;

    @IsString({ message: 'Địa điểm phải là chuỗi' })
    @MaxLength(300, { message: 'Địa điểm tối đa 300 ký tự' })
    rawLocation!: string;

    @IsOptional()
    @IsString({ message: 'Tỉnh/thành phải là chuỗi' })
    province?: string;

    @IsOptional()
    @IsString({ message: 'Quận/huyện phải là chuỗi' })
    district?: string;

    @IsOptional()
    @IsString({ message: 'Nhãn địa điểm phải là chuỗi' })
    label?: string;

    @IsOptional()
    @IsNumber({}, { message: 'Trọng số địa điểm phải là số' })
    @Min(0, { message: 'Trọng số địa điểm không được âm' })
    baseWeight?: number;
}

export class UpdateRealEstateContextDto {
    @IsArray({ message: 'Danh sách địa điểm phải là mảng' })
    @ValidateNested({ each: true })
    @Type(() => UserLocationAnchorDto)
    anchors!: UserLocationAnchorDto[];
}
