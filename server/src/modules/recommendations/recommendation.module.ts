import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UserBehaviorsModule } from '../user-behaviors/user-behaviors.module.ts';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module.ts';
import { UsersModule } from '../users/users.module.ts';
import {
    AdminRecommendationsController,
    RecommendationsController,
} from './recommendation.controller.ts';
import { RecommendationsService } from './recommendation.service.ts';

@Module({
    imports: [PrismaModule, UsersModule, UserBehaviorsModule, UserPreferencesModule],
    controllers: [AdminRecommendationsController, RecommendationsController],
    providers: [RecommendationsService, TokenGuard, RolesGuard],
    exports: [RecommendationsService],
})
export class RecommendationsModule {}
