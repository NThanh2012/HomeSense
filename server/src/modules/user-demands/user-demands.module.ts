import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { UserDemandsController } from './user-demands.controller.ts';
import { UserDemandsService } from './user-demands.service.ts';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [UserDemandsController],
    providers: [UserDemandsService, TokenGuard, RolesGuard],
    exports: [UserDemandsService],
})
export class UserDemandsModule {}
