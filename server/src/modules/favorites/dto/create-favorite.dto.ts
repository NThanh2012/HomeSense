import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFavoriteDto {
    @IsString({ message: 'Bất động sản phải là chuỗi' })
    @IsNotEmpty({ message: 'Bất động sản không được để trống' })
    propertyId: string;
}
