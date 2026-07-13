import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { ExternalBehaviorsModule } from '../external-behaviors/external-behaviors.module.ts';
import { RecommendationsModule } from '../recommendations/recommendation.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { AdminUserLearningJobsController, LearningJobsController } from './learning-jobs.controller.ts';
import { LearningJobsService } from './learning-jobs.service.ts';

@Module({
    imports: [PrismaModule, UsersModule, ExternalBehaviorsModule, RecommendationsModule],
    controllers: [LearningJobsController, AdminUserLearningJobsController],
    providers: [LearningJobsService, TokenGuard, RolesGuard],
    exports: [LearningJobsService],
})
export class LearningJobsModule {}
