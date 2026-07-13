import { Module } from '@nestjs/common';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { UsersModule } from '../users/users.module.ts';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';
import { LearningJobsModule } from '../learning-jobs/learning-jobs.module.ts';

@Module({
    imports: [UsersModule, LearningJobsModule],
    controllers: [AuthController],
    providers: [AuthService, TokenGuard],
    exports: [AuthService],
})
export class AuthModule {}
