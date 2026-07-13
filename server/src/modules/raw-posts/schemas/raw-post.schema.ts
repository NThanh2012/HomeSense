import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export enum RawPostStatus {
    NEW = 'NEW',
    ANALYZED = 'ANALYZED',
    FAILED = 'FAILED',
}

export type RawPostDocument = HydratedDocument<RawPost>;

@Schema({
    timestamps: true,
    collection: 'raw_posts',
})
export class RawPost {
    @Prop({ required: true, trim: true })
    sourceType: string;

    @Prop({ required: true, trim: true })
    sourceName: string;

    @Prop({ trim: true })
    sourceUrl?: string;

    @Prop({ trim: true })
    externalId?: string;

    @Prop({ trim: true })
    dataSourceId?: string;

    @Prop({ trim: true })
    sourceImportBatchId?: string;

    @Prop({ trim: true })
    permissionType?: string;

    @Prop({ trim: true })
    permissionNote?: string;

    @Prop({ required: true, trim: true })
    content: string;

    @Prop({ trim: true })
    contentHash?: string;

    @Prop({ trim: true })
    authorName?: string;

    @Prop({ trim: true })
    authorPhone?: string;

    @Prop({ type: [String], default: [] })
    mediaUrls: string[];

    @Prop({ enum: RawPostStatus, default: RawPostStatus.NEW })
    status: RawPostStatus;

    @Prop({ type: Date, default: Date.now })
    capturedAt: Date;

    @Prop({ type: Date })
    ingestedAt?: Date;

    @Prop({ trim: true })
    ingestedBy?: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    metadata?: Record<string, unknown>;

    createdAt?: Date;

    updatedAt?: Date;
}

export const RawPostSchema = SchemaFactory.createForClass(RawPost);

RawPostSchema.index({ sourceType: 1, externalId: 1 });
RawPostSchema.index({ dataSourceId: 1, externalId: 1 });
RawPostSchema.index({ dataSourceId: 1, sourceUrl: 1 });
RawPostSchema.index({ dataSourceId: 1, contentHash: 1 });
RawPostSchema.index({ sourceImportBatchId: 1 });
RawPostSchema.index({ status: 1, createdAt: -1 });
