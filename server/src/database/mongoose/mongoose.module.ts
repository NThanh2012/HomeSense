import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoUri } from './mongoose.config.ts';

@Global()
@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: () => ({
                uri: getMongoUri(),
            }),
        }),
    ],
    exports: [MongooseModule],
})
export class AppMongooseModule {}
