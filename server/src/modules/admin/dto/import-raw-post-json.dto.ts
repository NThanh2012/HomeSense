import { ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';

export class ImportRawPostJsonDto {
    @IsArray({ message: 'Danh sách raw post phải là mảng' })
    @ArrayMinSize(1, { message: 'Danh sách raw post không được để trống' })
    @ArrayMaxSize(50, { message: 'Mỗi lần chỉ được import tối đa 50 raw posts' })
    items: Record<string, unknown>[];
}
