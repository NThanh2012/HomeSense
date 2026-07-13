import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { UsersController } from './users.controller.ts';
import { UsersService } from './users.service.ts';

@Module({
    imports: [PrismaModule],
    controllers: [UsersController],
    providers: [UsersService, TokenGuard],
    exports: [UsersService],
})
export class UsersModule {}
