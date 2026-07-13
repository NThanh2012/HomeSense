import { get, post } from '../../lib/api-client';
import { getStoredToken } from '../auth/auth.api';
import {
    CreateUserBehaviorPayload,
    UserBehaviorEvent,
    UserBehaviorListQuery,
    UserBehaviorListResponse,
} from './user-behaviors.types';

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const createUserBehavior = (payload: CreateUserBehaviorPayload, token: string) => {
    return post<UserBehaviorEvent, CreateUserBehaviorPayload>(
        '/user-behaviors',
        payload,
        buildAuthOptions(token),
    );
};

export const getMyUserBehaviors = (query: UserBehaviorListQuery, token: string) => {
    return get<UserBehaviorListResponse>('/user-behaviors/me', query, buildAuthOptions(token));
};

export const trackUserBehavior = (payload: CreateUserBehaviorPayload) => {
    const token = getStoredToken();

    if (!token) {
        return;
    }

    void createUserBehavior(payload, token).catch(() => undefined);
};

export const userBehaviorsApi = {
    createUserBehavior,
    getMyUserBehaviors,
    trackUserBehavior,
};
