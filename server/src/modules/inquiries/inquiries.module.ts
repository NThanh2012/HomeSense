import { Module } from '@nestjs/common';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { InquiriesController } from './inquiries.controller.ts';
import { InquiriesService } from './inquiries.service.ts';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [InquiriesController],
    providers: [InquiriesService, TokenGuard],
    exports: [InquiriesService],
})
export class InquiriesModule {}
