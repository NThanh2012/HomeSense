import { IsBoolean } from 'class-validator';

export class UpdateDataSourceStatusDto {
    @IsBoolean({ message: 'Trạng thái nguồn dữ liệu không hợp lệ' })
    isActive: boolean;
}
