import { Module } from '@nestjs/common';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { PropertiesController } from './properties.controller.ts';
import { PropertiesService } from './properties.service.ts';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [PropertiesController],
    providers: [PropertiesService, TokenGuard],
    exports: [PropertiesService],
})
export class PropertiesModule {}
