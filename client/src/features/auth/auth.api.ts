import { get, patch, post } from '../../lib/api-client';
import {
    AuthSession,
    AuthUser,
    LoginPayload,
    LogoutResponse,
    RegisterPayload,
    UpdateUserPayload,
} from './auth.types';

const AUTH_TOKEN_KEY = 'support_bds_auth_token';

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const register = (payload: RegisterPayload) => {
    return post<AuthSession, RegisterPayload>('/auth/register', payload);
};

export const login = (payload: LoginPayload) => {
    return post<AuthSession, LoginPayload>('/auth/login', payload);
};

export const logout = (token: string) => {
    return post<LogoutResponse>('/auth/logout', undefined, buildAuthOptions(token));
};

export const getMe = (token: string) => {
    return get<AuthUser>('/users/me', undefined, buildAuthOptions(token));
};

export const updateMe = (payload: UpdateUserPayload, token: string) => {
    return patch<AuthUser, UpdateUserPayload>('/users/me', payload, buildAuthOptions(token));
};

export const getStoredToken = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setStoredToken = (token: string) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearStoredToken = () => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const authApi = {
    register,
    login,
    logout,
    getMe,
    updateMe,
    getStoredToken,
    setStoredToken,
    clearStoredToken,
};
