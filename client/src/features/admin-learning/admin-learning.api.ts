import { get, patch, post } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    ExternalBehavior,
    ExternalUserLink,
    LearningJob,
    LearningJobStatus,
    LearningJobType,
    PreferenceSignal,
    UserIntent,
} from './admin-learning.types';

const auth = (token: string): RequestInit => ({
    headers: { Authorization: `Bearer ${token}` },
});

export const getLearningJobs = (
    query: { status?: LearningJobStatus; type?: LearningJobType; userId?: string; limit?: number },
    token: string,
) => get<PaginatedResponse<LearningJob>>('/admin/learning-jobs', query, auth(token));

export const getLearningJob = (id: string, token: string) =>
    get<LearningJob>(`/admin/learning-jobs/${encodeURIComponent(id)}`, undefined, auth(token));

export const retryLearningJob = (id: string, token: string) =>
    post<LearningJob>(`/admin/learning-jobs/${encodeURIComponent(id)}/retry`, undefined, auth(token));

export const runUserLearning = (userId: string, token: string) =>
    post<LearningJob>(`/admin/users/${encodeURIComponent(userId)}/learning/run`, undefined, auth(token));

export const getExternalBehaviors = (
    query: { status?: ExternalBehavior['status']; limit?: number },
    token: string,
) => get<PaginatedResponse<ExternalBehavior>>('/admin/external-behaviors', query, auth(token));

export const retryExternalBehavior = (id: string, token: string) =>
    post<ExternalBehavior>(`/admin/external-behaviors/${encodeURIComponent(id)}/retry`, undefined, auth(token));

export const getExternalUserLinks = (
    query: { dataSourceId?: string; userId?: string; externalUserRef?: string; isActive?: boolean; limit?: number },
    token: string,
) => get<PaginatedResponse<ExternalUserLink>>('/admin/external-user-links', query, auth(token));

export const createExternalUserLink = (
    payload: { dataSourceId: string; externalUserRef: string; userId: string },
    token: string,
) => post<ExternalUserLink, typeof payload>('/admin/external-user-links', payload, auth(token));

export const updateExternalUserLinkStatus = (id: string, isActive: boolean, token: string) =>
    patch<ExternalUserLink, { isActive: boolean }>(
        `/admin/external-user-links/${encodeURIComponent(id)}/status`,
        { isActive },
        auth(token),
    );

export const getUserIntents = (userId: string, token: string) =>
    get<UserIntent[]>(`/admin/users/${encodeURIComponent(userId)}/intents`, undefined, auth(token));

export const getUserPreferenceSignals = (userId: string, token: string) =>
    get<PreferenceSignal[]>(`/admin/users/${encodeURIComponent(userId)}/preference-signals`, undefined, auth(token));
