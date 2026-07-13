import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesGuard } from '../../common/guards/roles.guard.ts';
import { TokenGuard } from '../../common/guards/token.guard.ts';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { UsersModule } from '../users/users.module.ts';
import { RawUserSignal, RawUserSignalSchema } from './schemas/raw-user-signal.schema.ts';
import { UserSignalsController } from './user-signals.controller.ts';
import { UserSignalsService } from './user-signals.service.ts';

@Module({
    imports: [
        PrismaModule,
        UsersModule,
        MongooseModule.forFeature([
            {
                name: RawUserSignal.name,
                schema: RawUserSignalSchema,
            },
        ]),
    ],
    controllers: [UserSignalsController],
    providers: [UserSignalsService, TokenGuard, RolesGuard],
    exports: [UserSignalsService],
})
export class UserSignalsModule {}
