import { get, patch } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    AdminInquiry,
    AdminInquiriesQuery,
    AdminOverview,
    AdminUserSummary,
    AdminPropertiesQuery,
    AdminUpdateInquiryStatusPayload,
    AdminUpdatePropertyStatusPayload,
} from './admin.types';
import { Property } from '../properties/properties.types';

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const getAdminOverview = (token: string) => {
    return get<AdminOverview>('/admin/overview', undefined, buildAuthOptions(token));
};

export const getAdminUsers = (
    params: { page?: number; limit?: number; keyword?: string },
    token: string,
) => get<PaginatedResponse<AdminUserSummary>>('/admin/users', params, buildAuthOptions(token));

export const getAdminProperties = (params: AdminPropertiesQuery, token: string) => {
    return get<PaginatedResponse<Property>>('/admin/properties', params, buildAuthOptions(token));
};

export const getAdminPropertyById = (id: string, token: string) => {
    return get<Property>(`/admin/properties/${encodeURIComponent(id)}`, undefined, buildAuthOptions(token));
};

export const updateAdminPropertyStatus = (
    id: string,
    payload: AdminUpdatePropertyStatusPayload,
    token: string,
) => {
    return patch<Property, AdminUpdatePropertyStatusPayload>(
        `/admin/properties/${encodeURIComponent(id)}/status`,
        payload,
        buildAuthOptions(token),
    );
};

export const getAdminInquiries = (params: AdminInquiriesQuery, token: string) => {
    return get<PaginatedResponse<AdminInquiry>>('/admin/inquiries', params, buildAuthOptions(token));
};

export const getAdminInquiryById = (id: string, token: string) => {
    return get<AdminInquiry>(`/admin/inquiries/${encodeURIComponent(id)}`, undefined, buildAuthOptions(token));
};

export const updateAdminInquiryStatus = (
    id: string,
    payload: AdminUpdateInquiryStatusPayload,
    token: string,
) => {
    return patch<AdminInquiry, AdminUpdateInquiryStatusPayload>(
        `/admin/inquiries/${encodeURIComponent(id)}/status`,
        payload,
        buildAuthOptions(token),
    );
};

export const adminApi = {
    getAdminOverview,
    getAdminUsers,
    getAdminProperties,
    getAdminPropertyById,
    updateAdminPropertyStatus,
    getAdminInquiries,
    getAdminInquiryById,
    updateAdminInquiryStatus,
};
