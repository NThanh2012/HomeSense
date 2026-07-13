import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePropertyAnalysisDto {
    @IsString()
    @IsNotEmpty({ message: 'Raw post id không được để trống' })
    rawPostId: string;
}
