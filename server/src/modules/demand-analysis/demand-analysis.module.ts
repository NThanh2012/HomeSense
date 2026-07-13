import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { UserSignalsModule } from '../user-signals/user-signals.module.ts';
import { DemandAnalysisController } from './demand-analysis.controller.ts';
import { DemandAnalysisService } from './demand-analysis.service.ts';

@Module({
    imports: [PrismaModule, UsersModule, UserSignalsModule],
    controllers: [DemandAnalysisController],
    providers: [DemandAnalysisService, TokenGuard, RolesGuard],
    exports: [DemandAnalysisService],
})
export class DemandAnalysisModule {}
