import { Module } from '@nestjs/common';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { UserLearningModule } from '../user-learning/user-learning.module.ts';
import { UserBehaviorsController } from './user-behaviors.controller.ts';
import { UserBehaviorsService } from './user-behaviors.service.ts';

@Module({
    imports: [PrismaModule, UsersModule, UserLearningModule],
    controllers: [UserBehaviorsController],
    providers: [UserBehaviorsService, TokenGuard],
    exports: [UserBehaviorsService],
})
export class UserBehaviorsModule {}
