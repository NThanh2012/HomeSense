import { AuthUser } from '../auth/auth.types';
import {
    PropertyStatus,
    PropertyType,
    TransactionType,
} from '../properties/properties.types';
import { Inquiry, InquiryStatus } from '../inquiries/inquiries.types';

export interface AdminOverview {
    totalProperties: number;
    totalUsers: number;
    totalInquiries: number;
    pendingInquiries: number;
    propertiesByStatus: Record<PropertyStatus, number>;
}

export interface AdminUserSummary {
    id: string;
    email: string;
    fullName?: string | null;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    createdAt: string;
}

export interface AdminPropertiesQuery {
    page?: number;
    limit?: number;
    keyword?: string;
    transactionType?: TransactionType;
    propertyType?: PropertyType;
    status?: PropertyStatus;
    minPrice?: number;
    maxPrice?: number;
}

export interface AdminInquiriesQuery {
    page?: number;
    limit?: number;
    status?: InquiryStatus;
}

export interface AdminUpdatePropertyStatusPayload {
    status: PropertyStatus;
}

export interface AdminUpdateInquiryStatusPayload {
    status: InquiryStatus;
}

export interface AdminInquiry extends Inquiry {
    userId: string;
    user: AuthUser;
}
