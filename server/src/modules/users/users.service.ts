import { Injectable } from '@nestjs/common';
import { User, UserRole, UserStatus } from '@prisma/client';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { RequestUser } from '../../common/types/request-user.type.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { UpdateUserDto } from './dto/update-user.dto.ts';

interface CreateUserInput {
    email: string;
    passwordHash: string;
    fullName?: string;
    phone?: string;
    authToken?: string;
}

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {
                email: email,
            },
        });
    }

    async findActiveByToken(token: string) {
        return this.prisma.user.findFirst({
            where: {
                authToken: token,
                status: UserStatus.ACTIVE,
            },
        });
    }

    async create(input: CreateUserInput) {
        return this.prisma.user.create({
            data: {
                email: input.email,
                passwordHash: input.passwordHash,
                fullName: input.fullName,
                phone: input.phone,
                authToken: input.authToken,
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
            },
        });
    }

    async getMe(userId: string) {
        const user = await this.findById(userId);
        return this.toResponse(user);
    }

    async updateMe(userId: string, dto: UpdateUserDto) {
        await this.findById(userId);

        const user = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                fullName: dto.fullName,
                phone: dto.phone,
            },
        });

        return this.toResponse(user);
    }

    async updateAuthToken(userId: string, token: string | null) {
        return this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                authToken: token,
            },
        });
    }

    toRequestUser(user: User): RequestUser {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status,
        };
    }

    toResponse(user: User) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }

    private async findById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy người dùng');
        }

        return user;
    }
}
