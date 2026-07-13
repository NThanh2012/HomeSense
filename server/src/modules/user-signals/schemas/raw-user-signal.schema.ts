import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export enum RawUserSignalStatus {
    NEW = 'NEW',
    ANALYZED = 'ANALYZED',
    FAILED = 'FAILED',
    INVALID = 'INVALID',
}

export enum RawUserSignalConsentType {
    PUBLIC_ALLOWED = 'PUBLIC_ALLOWED',
    USER_PROVIDED = 'USER_PROVIDED',
    AUTHORIZED_API = 'AUTHORIZED_API',
    PARTNER = 'PARTNER',
    DEV_TEST = 'DEV_TEST',
}

export type RawUserSignalDocument = HydratedDocument<RawUserSignal>;

@Schema({
    timestamps: true,
    collection: 'raw_user_signals',
})
export class RawUserSignal {
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
    externalUserRef?: string;

    @Prop({ required: true, trim: true })
    content: string;

    @Prop({ required: true, trim: true })
    contentHash: string;

    @Prop({ trim: true })
    authorName?: string;

    @Prop({ trim: true })
    authorPhone?: string;

    @Prop({ trim: true })
    authorProfileUrl?: string;

    @Prop({ type: Date, default: Date.now })
    capturedAt: Date;

    @Prop({ type: Date })
    ingestedAt?: Date;

    @Prop({ trim: true })
    ingestedBy?: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    metadata?: Record<string, unknown>;

    @Prop({ enum: RawUserSignalStatus, default: RawUserSignalStatus.NEW })
    status: RawUserSignalStatus;

    @Prop({ enum: RawUserSignalConsentType, required: true })
    consentType: RawUserSignalConsentType;

    @Prop({ trim: true })
    permissionNote?: string;

    createdAt?: Date;

    updatedAt?: Date;
}

export const RawUserSignalSchema = SchemaFactory.createForClass(RawUserSignal);

RawUserSignalSchema.index({ sourceType: 1, externalId: 1 });
RawUserSignalSchema.index({ dataSourceId: 1, externalId: 1 });
RawUserSignalSchema.index({ dataSourceId: 1, sourceUrl: 1 });
RawUserSignalSchema.index({ dataSourceId: 1, contentHash: 1 });
RawUserSignalSchema.index({ sourceImportBatchId: 1 });
RawUserSignalSchema.index({ sourceUrl: 1 });
RawUserSignalSchema.index({ contentHash: 1 });
RawUserSignalSchema.index({ status: 1, capturedAt: -1 });
