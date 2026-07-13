import { Property } from '../properties/properties.types';

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'CLOSED';

export interface CreateInquiryPayload {
    propertyId: string;
    message: string;
    contactName?: string;
    contactPhone?: string;
}

export interface Inquiry {
    id: string;
    propertyId: string;
    message: string;
    contactName: string | null;
    contactPhone: string | null;
    status: InquiryStatus;
    createdAt: string;
    updatedAt: string;
    property: Property;
}

export interface InquiryListQuery {
    page?: number;
    limit?: number;
}
