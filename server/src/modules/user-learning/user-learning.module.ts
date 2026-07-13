import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { AdminUserLearningController, UserLearningController } from './user-learning.controller.ts';
import { UserLearningService } from './user-learning.service.ts';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [UserLearningController, AdminUserLearningController],
    providers: [UserLearningService, TokenGuard, RolesGuard],
    exports: [UserLearningService],
})
export class UserLearningModule {}
