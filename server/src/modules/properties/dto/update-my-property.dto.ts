import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto.ts';

export class UpdateMyPropertyDto extends PartialType(CreatePropertyDto) {}
