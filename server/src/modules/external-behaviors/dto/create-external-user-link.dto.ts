import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateExternalUserLinkDto {
    @IsUUID('4', { message: 'Data source id không hợp lệ' })
    dataSourceId: string;

    @IsString({ message: 'External user ref không hợp lệ' })
    @IsNotEmpty({ message: 'External user ref không được để trống' })
    @MaxLength(200, { message: 'External user ref không được quá 200 ký tự' })
    externalUserRef: string;

    @IsUUID('4', { message: 'User id không hợp lệ' })
    userId: string;
}
