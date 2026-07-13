import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma/prisma.module.ts';
import { AppMongooseModule } from './database/mongoose/mongoose.module.ts';
import { HealthModule } from './modules/health/health.module.ts';
import { PropertiesModule } from './modules/properties/properties.module.ts';
import { UsersModule } from './modules/users/users.module.ts';
import { AuthModule } from './modules/auth/auth.module.ts';
import { FavoritesModule } from './modules/favorites/favorites.module.ts';
import { InquiriesModule } from './modules/inquiries/inquiries.module.ts';
import { AdminModule } from './modules/admin/admin.module.ts';
import { UserSignalsModule } from './modules/user-signals/user-signals.module.ts';
import { UserDemandsModule } from './modules/user-demands/user-demands.module.ts';
import { DemandAnalysisModule } from './modules/demand-analysis/demand-analysis.module.ts';
import { RecommendationsModule } from './modules/recommendations/recommendation.module.ts';
import { UserBehaviorsModule } from './modules/user-behaviors/user-behaviors.module.ts';
import { UserPreferencesModule } from './modules/user-preferences/user-preferences.module.ts';
import { DataSourcesModule } from './modules/data-sources/data-sources.module.ts';
import { SourceImportsModule } from './modules/source-imports/source-imports.module.ts';
import { ExternalBehaviorsModule } from './modules/external-behaviors/external-behaviors.module.ts';
import { UserLearningModule } from './modules/user-learning/user-learning.module.ts';
import { LearningJobsModule } from './modules/learning-jobs/learning-jobs.module.ts';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../.env'],
        }),
        PrismaModule,
        AppMongooseModule,
        HealthModule,
        PropertiesModule,
        UsersModule,
        AuthModule,
        FavoritesModule,
        InquiriesModule,
        AdminModule,
        UserSignalsModule,
        UserDemandsModule,
        DemandAnalysisModule,
        RecommendationsModule,
        UserBehaviorsModule,
        UserPreferencesModule,
        DataSourcesModule,
        SourceImportsModule,
        ExternalBehaviorsModule,
        UserLearningModule,
        LearningJobsModule,
    ],
})
export class AppModule {}
