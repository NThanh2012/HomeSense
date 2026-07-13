import { get, post } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    AdminImportJsonPayload,
    AdminSourceImportBatch,
    AdminSourceImportsQuery,
} from './admin-source-imports.types';

const auth = (token: string): RequestInit => ({
    headers: { Authorization: `Bearer ${token}` },
});

export const getAdminSourceImports = (query: AdminSourceImportsQuery, token: string) =>
    get<PaginatedResponse<AdminSourceImportBatch>>('/admin/source-imports', query, auth(token));

export const getAdminSourceImport = (id: string, token: string) =>
    get<AdminSourceImportBatch>(
        `/admin/source-imports/${encodeURIComponent(id)}`,
        undefined,
        auth(token),
    );

export const importAdminSourceJson = (payload: AdminImportJsonPayload, token: string) =>
    post<AdminSourceImportBatch, AdminImportJsonPayload>(
        '/admin/source-imports/json',
        payload,
        auth(token),
    );
