import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
    @IsString({ message: 'Họ tên phải là chuỗi' })
    @MaxLength(120, { message: 'Họ tên không được quá 120 ký tự' })
    @IsOptional()
    fullName?: string;

    @IsString({ message: 'Số điện thoại phải là chuỗi' })
    @MaxLength(30, { message: 'Số điện thoại không được quá 30 ký tự' })
    @IsOptional()
    phone?: string;
}
