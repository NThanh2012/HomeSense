import { get, post } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    AdminCreateUserSignalPayload,
    AdminCreateUserSignalResult,
    AdminUserSignal,
    AdminUserSignalDetail,
    AdminUserSignalsQuery,
} from './admin-user-signals.types';
import { DemandAnalysisResult } from '../admin-user-demands/admin-user-demands.types';

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const getAdminUserSignals = (params: AdminUserSignalsQuery, token: string) => {
    return get<PaginatedResponse<AdminUserSignal>>(
        '/admin/user-signals',
        params,
        buildAuthOptions(token),
    );
};

export const createAdminUserSignal = (
    payload: AdminCreateUserSignalPayload,
    token: string,
) => {
    return post<AdminCreateUserSignalResult, AdminCreateUserSignalPayload>(
        '/admin/user-signals',
        payload,
        buildAuthOptions(token),
    );
};

export const getAdminUserSignalById = (id: string, token: string) => {
    return get<AdminUserSignalDetail>(
        `/admin/user-signals/${encodeURIComponent(id)}`,
        undefined,
        buildAuthOptions(token),
    );
};

export const analyzeAdminUserSignal = (id: string, token: string) => {
    return post<DemandAnalysisResult>(
        `/admin/demand-analysis/user-signals/${encodeURIComponent(id)}`,
        undefined,
        buildAuthOptions(token),
    );
};
