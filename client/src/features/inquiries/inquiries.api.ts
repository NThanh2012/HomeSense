import { get, post } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import { CreateInquiryPayload, Inquiry, InquiryListQuery } from './inquiries.types';

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const createInquiry = (payload: CreateInquiryPayload, token: string) => {
    return post<Inquiry, CreateInquiryPayload>('/inquiries', payload, buildAuthOptions(token));
};

export const getMyInquiries = (params: InquiryListQuery, token: string) => {
    return get<PaginatedResponse<Inquiry>>('/inquiries/me', params, buildAuthOptions(token));
};

export const getInquiryById = (id: string, token: string) => {
    return get<Inquiry>(`/inquiries/${encodeURIComponent(id)}`, undefined, buildAuthOptions(token));
};

export const inquiriesApi = {
    createInquiry,
    getMyInquiries,
    getInquiryById,
};
