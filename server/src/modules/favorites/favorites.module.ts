import { Module } from '@nestjs/common';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { FavoritesController } from './favorites.controller.ts';
import { FavoritesService } from './favorites.service.ts';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [FavoritesController],
    providers: [FavoritesService, TokenGuard],
    exports: [FavoritesService],
})
export class FavoritesModule {}
