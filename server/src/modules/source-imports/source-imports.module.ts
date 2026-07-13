import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { DataSourcesModule } from '../data-sources/data-sources.module.ts';
import { UserSignalsModule } from '../user-signals/user-signals.module.ts';
import { ExternalBehaviorsModule } from '../external-behaviors/external-behaviors.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { SourceImportsController } from './source-imports.controller.ts';
import { SourceImportsService } from './source-imports.service.ts';
import { LearningJobsModule } from '../learning-jobs/learning-jobs.module.ts';

@Module({
    imports: [
        PrismaModule,
        UsersModule,
        DataSourcesModule,
        UserSignalsModule,
        ExternalBehaviorsModule,
        LearningJobsModule,
    ],
    controllers: [SourceImportsController],
    providers: [SourceImportsService, TokenGuard, RolesGuard],
})
export class SourceImportsModule {}
