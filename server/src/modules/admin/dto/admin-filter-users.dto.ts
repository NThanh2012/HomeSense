import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';

export class AdminFilterUsersDto extends PaginationQueryDto {
    @IsOptional()
    @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
    @MaxLength(100, { message: 'Từ khóa tìm kiếm không được vượt quá 100 ký tự' })
    keyword?: string;
}
