import { Module } from '@nestjs/common';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { UserPreferencesController } from './user-preferences.controller.ts';
import { UserPreferencesService } from './user-preferences.service.ts';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [UserPreferencesController],
    providers: [UserPreferencesService, TokenGuard],
    exports: [UserPreferencesService],
})
export class UserPreferencesModule {}
