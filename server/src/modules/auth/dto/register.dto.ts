import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString({ message: 'Email phải là chuỗi' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @MaxLength(160, { message: 'Email không được quá 160 ký tự' })
    email: string;

    @IsString({ message: 'Mật khẩu phải là chuỗi' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @MaxLength(72, { message: 'Mật khẩu không được quá 72 ký tự' })
    password: string;

    @IsString({ message: 'Họ tên phải là chuỗi' })
    @MaxLength(120, { message: 'Họ tên không được quá 120 ký tự' })
    @IsOptional()
    fullName?: string;

    @IsString({ message: 'Số điện thoại phải là chuỗi' })
    @MaxLength(30, { message: 'Số điện thoại không được quá 30 ký tự' })
    @IsOptional()
    phone?: string;
}
