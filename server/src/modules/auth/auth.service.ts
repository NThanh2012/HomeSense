import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { RequestUser } from '../../common/types/request-user.type.ts';
import { UsersService } from '../users/users.service.ts';
import { LoginDto } from './dto/login.dto.ts';
import { RegisterDto } from './dto/register.dto.ts';
import { LearningJobsService } from '../learning-jobs/learning-jobs.service.ts';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly learningJobsService: LearningJobsService,
    ) {}

    async register(dto: RegisterDto) {
        const email = this.normalizeEmail(dto.email);
        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'Email đã được sử dụng');
        }

        const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
        const token = randomUUID();
        const user = await this.usersService.create({
            email: email,
            passwordHash: passwordHash,
            fullName: this.normalizeOptionalText(dto.fullName),
            phone: this.normalizeOptionalText(dto.phone),
            authToken: token,
        });

        return {
            user: this.usersService.toResponse(user),
            token: token,
        };
    }

    async login(dto: LoginDto) {
        const email = this.normalizeEmail(dto.email);
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'Email hoặc mật khẩu không đúng');
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'Tài khoản không hoạt động');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'Email hoặc mật khẩu không đúng');
        }

        const token = randomUUID();
        const updatedUser = await this.usersService.updateAuthToken(user.id, token);
        const recommendationRefresh = await this.refreshRecommendationsSafely(user.id);

        return {
            user: this.usersService.toResponse(updatedUser),
            token: token,
            recommendationRefresh: recommendationRefresh,
        };
    }

    async logout(user: RequestUser) {
        await this.usersService.updateAuthToken(user.id, null);

        return {
            loggedOut: true,
        };
    }

    private normalizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    private normalizeOptionalText(value?: string) {
        const normalized = value?.trim();
        return normalized || undefined;
    }

    private async refreshRecommendationsSafely(userId: string) {
        try {
            return await this.learningJobsService.queueOnLogin(userId);
        } catch {
            return {
                status: 'FAILED' as const,
                jobId: null,
                hasExistingRecommendations: false,
            };
        }
    }
}
