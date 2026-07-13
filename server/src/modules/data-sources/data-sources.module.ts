import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { DataSourcesController } from './data-sources.controller.ts';
import { DataSourcesService } from './data-sources.service.ts';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [DataSourcesController],
    providers: [DataSourcesService, TokenGuard, RolesGuard],
    exports: [DataSourcesService],
})
export class DataSourcesModule {}
