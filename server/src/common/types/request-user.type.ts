import { Request } from 'express';
import { UserRole, UserStatus } from '@prisma/client';

export interface RequestUser {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: UserRole;
    status: UserStatus;
}

export interface RequestWithUser extends Request {
    user?: RequestUser;
}
