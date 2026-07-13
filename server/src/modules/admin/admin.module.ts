import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { AdminController } from './admin.controller.ts';
import { AdminService } from './admin.service.ts';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [AdminController],
    providers: [AdminService, TokenGuard, RolesGuard],
})
export class AdminModule {}
