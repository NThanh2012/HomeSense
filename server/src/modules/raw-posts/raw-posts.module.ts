import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RawPostsController } from './raw-posts.controller.ts';
import { RawPostsService } from './raw-posts.service.ts';
import { RawPost, RawPostSchema } from './schemas/raw-post.schema.ts';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: RawPost.name,
                schema: RawPostSchema,
            },
        ]),
    ],
    controllers: [RawPostsController],
    providers: [RawPostsService],
    exports: [RawPostsService],
})
export class RawPostsModule {}
