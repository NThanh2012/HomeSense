import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.ts';
import { RawPostStatus } from '../../raw-posts/schemas/raw-post.schema.ts';

export class AdminFilterRawPostsDto extends PaginationQueryDto {
    @IsEnum(RawPostStatus, { message: 'Trạng thái raw post không hợp lệ' })
    @IsOptional()
    status?: RawPostStatus;

    @IsString({ message: 'Loại nguồn phải là chuỗi' })
    @IsOptional()
    sourceType?: string;

    @IsString({ message: 'Từ khóa phải là chuỗi' })
    @IsOptional()
    keyword?: string;
}
