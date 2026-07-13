import { IsDateString, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class ImportExternalBehaviorItemDto {
    @IsString({ message: 'External id không hợp lệ' })
    @IsOptional()
    @MaxLength(200, { message: 'External id không được quá 200 ký tự' })
    externalId?: string;

    @IsString({ message: 'External user ref không hợp lệ' })
    @IsNotEmpty({ message: 'External user ref không được để trống' })
    @MaxLength(200, { message: 'External user ref không được quá 200 ký tự' })
    externalUserRef: string;

    @IsDateString({}, { message: 'Thời gian hành vi không đúng định dạng' })
    @IsOptional()
    occurredAt?: string;

    @IsObject({ message: 'Payload hành vi phải là object' })
    payload: Record<string, unknown>;
}
