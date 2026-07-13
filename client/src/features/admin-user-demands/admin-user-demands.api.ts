import { get, patch } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    AdminUpdateUserDemandStatusPayload,
    AdminUserDemand,
    AdminUserDemandsQuery,
} from './admin-user-demands.types';

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const getAdminUserDemands = (params: AdminUserDemandsQuery, token: string) => {
    return get<PaginatedResponse<AdminUserDemand>>(
        '/admin/user-demands',
        params,
        buildAuthOptions(token),
    );
};

export const getAdminUserDemandById = (id: string, token: string) => {
    return get<AdminUserDemand>(
        `/admin/user-demands/${encodeURIComponent(id)}`,
        undefined,
        buildAuthOptions(token),
    );
};

export const updateAdminUserDemandStatus = (
    id: string,
    payload: AdminUpdateUserDemandStatusPayload,
    token: string,
) => {
    return patch<AdminUserDemand, AdminUpdateUserDemandStatusPayload>(
        `/admin/user-demands/${encodeURIComponent(id)}/status`,
        payload,
        buildAuthOptions(token),
    );
};
