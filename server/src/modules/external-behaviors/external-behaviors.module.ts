import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { RecommendationsModule } from '../recommendations/recommendation.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { ExternalBehaviorAnalyzer } from './analyzers/external-behavior-analyzer.ts';
import { GeminiExternalBehaviorAnalyzer } from './analyzers/gemini-external-behavior-analyzer.service.ts';
import { CostOptimizedExternalBehaviorAnalyzer } from './analyzers/cost-optimized-external-behavior-analyzer.service.ts';
import { UserLearningModule } from '../user-learning/user-learning.module.ts';
import {
    ExternalBehaviorsController,
    ExternalUserLinksController,
} from './external-behaviors.controller.ts';
import { ExternalBehaviorLearningService } from './external-behavior-learning.service.ts';
import { ExternalBehaviorsService } from './external-behaviors.service.ts';
import { ExternalUserLinksService } from './external-user-links.service.ts';
import {
    RawExternalBehavior,
    RawExternalBehaviorSchema,
} from './schemas/raw-external-behavior.schema.ts';

@Module({
    imports: [
        PrismaModule,
        RecommendationsModule,
        UsersModule,
        UserLearningModule,
        MongooseModule.forFeature([
            {
                name: RawExternalBehavior.name,
                schema: RawExternalBehaviorSchema,
            },
        ]),
    ],
    controllers: [ExternalBehaviorsController, ExternalUserLinksController],
    providers: [
        ExternalBehaviorsService,
        ExternalUserLinksService,
        ExternalBehaviorLearningService,
        GeminiExternalBehaviorAnalyzer,
        CostOptimizedExternalBehaviorAnalyzer,
        {
            provide: ExternalBehaviorAnalyzer,
            useExisting: CostOptimizedExternalBehaviorAnalyzer,
        },
        TokenGuard,
        RolesGuard,
    ],
    exports: [ExternalBehaviorsService, ExternalUserLinksService, ExternalBehaviorLearningService],
})
export class ExternalBehaviorsModule {}
