import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export enum RawExternalBehaviorStatus {
    PENDING = 'PENDING',
    ANALYZED = 'ANALYZED',
    REVIEW_REQUIRED = 'REVIEW_REQUIRED',
    FAILED = 'FAILED',
}

export type RawExternalBehaviorDocument = HydratedDocument<RawExternalBehavior>;

@Schema({
    timestamps: true,
    collection: 'raw_external_behaviors',
})
export class RawExternalBehavior {
    @Prop({ required: true, trim: true })
    dataSourceId: string;

    @Prop({ required: true, trim: true })
    sourceImportBatchId: string;

    @Prop({ required: true, trim: true })
    sourceType: string;

    @Prop({ required: true, trim: true })
    sourceName: string;

    @Prop({ required: true, trim: true })
    permissionType: string;

    @Prop({ required: true, trim: true })
    permissionNote: string;

    @Prop({ required: true, trim: true })
    ingestedBy: string;

    @Prop({ trim: true })
    externalId?: string;

    @Prop({ required: true, trim: true })
    externalUserRef: string;

    @Prop({ type: Date })
    occurredAt?: Date;

    @Prop({ type: MongooseSchema.Types.Mixed, required: true })
    payload: Record<string, unknown>;

    @Prop({ required: true, trim: true })
    contentHash: string;

    @Prop({ type: Date, default: Date.now })
    ingestedAt: Date;

    @Prop({ enum: RawExternalBehaviorStatus, default: RawExternalBehaviorStatus.PENDING })
    status: RawExternalBehaviorStatus;

    @Prop({ trim: true })
    analysisError?: string;

    @Prop({ type: Date })
    analyzedAt?: Date;

    createdAt?: Date;

    updatedAt?: Date;
}

export const RawExternalBehaviorSchema = SchemaFactory.createForClass(RawExternalBehavior);

RawExternalBehaviorSchema.index({ dataSourceId: 1, externalId: 1 });
RawExternalBehaviorSchema.index({ dataSourceId: 1, contentHash: 1 });
RawExternalBehaviorSchema.index({ sourceImportBatchId: 1 });
RawExternalBehaviorSchema.index({ dataSourceId: 1, externalUserRef: 1, status: 1, occurredAt: -1 });
