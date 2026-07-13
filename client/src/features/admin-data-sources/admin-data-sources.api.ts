import { get, patch, post } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    AdminDataSource,
    AdminDataSourcePayload,
    AdminDataSourcesQuery,
    AdminUpdateDataSourcePayload,
} from './admin-data-sources.types';

const auth = (token: string): RequestInit => ({
    headers: { Authorization: `Bearer ${token}` },
});

export const getAdminDataSources = (query: AdminDataSourcesQuery, token: string) =>
    get<PaginatedResponse<AdminDataSource>>('/admin/data-sources', query, auth(token));

export const getAdminDataSource = (id: string, token: string) =>
    get<AdminDataSource>(`/admin/data-sources/${encodeURIComponent(id)}`, undefined, auth(token));

export const createAdminDataSource = (payload: AdminDataSourcePayload, token: string) =>
    post<AdminDataSource, AdminDataSourcePayload>('/admin/data-sources', payload, auth(token));

export const updateAdminDataSource = (
    id: string,
    payload: AdminUpdateDataSourcePayload,
    token: string,
) =>
    patch<AdminDataSource, AdminUpdateDataSourcePayload>(
        `/admin/data-sources/${encodeURIComponent(id)}`,
        payload,
        auth(token),
    );

export const updateAdminDataSourceStatus = (id: string, isActive: boolean, token: string) =>
    patch<AdminDataSource, { isActive: boolean }>(
        `/admin/data-sources/${encodeURIComponent(id)}/status`,
        { isActive },
        auth(token),
    );
