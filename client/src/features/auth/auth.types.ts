export type UserRole = 'USER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface AuthUser {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export interface AuthSession {
    user: AuthUser;
    token: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface UpdateUserPayload {
    fullName?: string;
    phone?: string;
}

export interface LogoutResponse {
    loggedOut: boolean;
}
