import { UserRole, UserStatus } from '@prisma/client';

export class UserResponseDto {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}
