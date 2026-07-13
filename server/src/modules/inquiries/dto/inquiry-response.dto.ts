import { InquiryStatus } from '@prisma/client';

export class InquiryResponseDto {
    id: string;
    propertyId: string;
    message: string;
    contactName: string | null;
    contactPhone: string | null;
    status: InquiryStatus;
    createdAt: string;
    updatedAt: string;
    property: unknown;
}
