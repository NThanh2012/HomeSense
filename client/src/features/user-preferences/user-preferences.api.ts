import { get, post } from '../../lib/api-client';
import { UserPreferenceProfile } from './user-preferences.types';

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const getMyPreferenceProfile = (token: string) => {
    return get<UserPreferenceProfile>('/user-preferences/me', undefined, buildAuthOptions(token));
};

export const recomputeMyPreferenceProfile = (token: string) => {
    return post<UserPreferenceProfile>('/user-preferences/recompute', undefined, buildAuthOptions(token));
};

export const userPreferencesApi = {
    getMyPreferenceProfile,
    recomputeMyPreferenceProfile,
};
