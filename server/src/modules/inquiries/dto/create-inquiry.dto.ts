import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInquiryDto {
    @IsString({ message: 'Bất động sản phải là chuỗi' })
    @IsNotEmpty({ message: 'Bất động sản không được để trống' })
    propertyId: string;

    @IsString({ message: 'Nội dung yêu cầu phải là chuỗi' })
    @IsNotEmpty({ message: 'Nội dung yêu cầu không được để trống' })
    @MaxLength(1000, { message: 'Nội dung yêu cầu không được quá 1000 ký tự' })
    message: string;

    @IsString({ message: 'Tên liên hệ phải là chuỗi' })
    @MaxLength(120, { message: 'Tên liên hệ không được quá 120 ký tự' })
    @IsOptional()
    contactName?: string;

    @IsString({ message: 'Số điện thoại liên hệ phải là chuỗi' })
    @MaxLength(30, { message: 'Số điện thoại liên hệ không được quá 30 ký tự' })
    @IsOptional()
    contactPhone?: string;
}
