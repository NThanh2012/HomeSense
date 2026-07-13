import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DataPermissionType, DataSourceType } from '@prisma/client';
import { FilterQuery, Model, Types } from 'mongoose';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { FilterExternalBehaviorDto } from './dto/filter-external-behavior.dto.ts';
import {
    RawExternalBehavior,
    RawExternalBehaviorDocument,
    RawExternalBehaviorStatus,
} from './schemas/raw-external-behavior.schema.ts';

export interface GovernedExternalBehaviorInput {
    dataSourceId: string;
    sourceImportBatchId: string;
    sourceType: DataSourceType;
    sourceName: string;
    permissionType: DataPermissionType;
    permissionNote: string;
    ingestedBy: string;
    externalId?: string;
    externalUserRef: string;
    occurredAt?: string;
    payload: Record<string, unknown>;
}

export interface ExternalBehaviorLookup {
    dataSourceId: string;
    externalUserRef: string;
}

@Injectable()
export class ExternalBehaviorsService {
    constructor(
        @InjectModel(RawExternalBehavior.name)
        private readonly model: Model<RawExternalBehaviorDocument>,
    ) {}

    async ingestGoverned(input: GovernedExternalBehaviorInput) {
        const contentHash = this.hashPayload(input.externalUserRef, input.payload, input.occurredAt);
        const existing = await this.findDuplicate(input, contentHash);

        if (existing) {
            return { action: 'skipped' as const, behavior: this.toResponse(existing) };
        }

        const behavior = await this.model.create({
            ...input,
            externalId: input.externalId?.trim() || undefined,
            externalUserRef: input.externalUserRef.trim(),
            occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
            contentHash: contentHash,
            ingestedAt: new Date(),
            status: RawExternalBehaviorStatus.PENDING,
        });

        return { action: 'created' as const, behavior: this.toResponse(behavior) };
    }

    async findAll(query: FilterExternalBehaviorDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where: FilterQuery<RawExternalBehaviorDocument> = {};

        if (query.dataSourceId) where.dataSourceId = query.dataSourceId;
        if (query.externalUserRef) where.externalUserRef = query.externalUserRef;
        if (query.status) where.status = query.status;

        const [items, total] = await Promise.all([
            this.model.find(where).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
            this.model.countDocuments(where).exec(),
        ]);

        return buildPaginatedResult(items.map((item) => this.toResponse(item)), page, limit, total);
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'External behavior id không hợp lệ');
        }

        const behavior = await this.model.findById(id).exec();
        if (!behavior) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy external behavior');
        }

        return this.toResponse(behavior);
    }

    async findPendingBundle(links: ExternalBehaviorLookup[], maxRecords: number, maxBytes: number) {
        if (links.length === 0) return [];

        const documents = await this.model
            .find({
                $or: links.map((link) => ({
                    dataSourceId: link.dataSourceId,
                    externalUserRef: link.externalUserRef,
                })),
                status: { $in: [RawExternalBehaviorStatus.PENDING, RawExternalBehaviorStatus.FAILED] },
            })
            .sort({ occurredAt: 1, createdAt: 1 })
            .limit(maxRecords)
            .exec();
        const result: ReturnType<ExternalBehaviorsService['toResponse']>[] = [];
        let bytes = 0;

        for (const document of documents) {
            const response = this.toResponse(document);
            const nextBytes = Buffer.byteLength(JSON.stringify(response.payload), 'utf8');
            if (result.length > 0 && bytes + nextBytes > maxBytes) break;
            result.push(response);
            bytes += nextBytes;
        }

        return result;
    }

    async countPending(links: ExternalBehaviorLookup[]) {
        if (links.length === 0) return 0;
        return this.model.countDocuments({
            $or: links.map((link) => ({
                dataSourceId: link.dataSourceId,
                externalUserRef: link.externalUserRef,
            })),
            status: { $in: [RawExternalBehaviorStatus.PENDING, RawExternalBehaviorStatus.FAILED] },
        });
    }

    async markStatus(id: string, status: RawExternalBehaviorStatus, analysisError?: string) {
        await this.model.updateOne(
            { _id: id },
            {
                $set: {
                    status: status,
                    analysisError: analysisError,
                    analyzedAt:
                        status === RawExternalBehaviorStatus.ANALYZED ||
                        status === RawExternalBehaviorStatus.REVIEW_REQUIRED
                            ? new Date()
                            : undefined,
                },
            },
        );
    }

    async retry(id: string) {
        await this.findOne(id);
        await this.markStatus(id, RawExternalBehaviorStatus.PENDING);
        return this.findOne(id);
    }

    async deleteAnalyzed(id: string) {
        await this.model.deleteOne({ _id: id, status: RawExternalBehaviorStatus.ANALYZED }).exec();
    }

    private async findDuplicate(input: GovernedExternalBehaviorInput, contentHash: string) {
        if (input.externalId?.trim()) {
            const byExternalId = await this.model.findOne({
                dataSourceId: input.dataSourceId,
                externalId: input.externalId.trim(),
            });
            if (byExternalId) return byExternalId;
        }

        return this.model.findOne({
            dataSourceId: input.dataSourceId,
            contentHash: contentHash,
        });
    }

    private hashPayload(
        externalUserRef: string,
        payload: Record<string, unknown>,
        occurredAt?: string,
    ) {
        return createHash('sha256')
            .update(
                `${externalUserRef.trim().toLowerCase()}:${occurredAt ?? ''}:${this.stableStringify(payload)}`,
            )
            .digest('hex');
    }

    private stableStringify(value: unknown): string {
        if (Array.isArray(value)) {
            return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
        }
        if (value && typeof value === 'object') {
            const entries = Object.entries(value as Record<string, unknown>)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, item]) => `${JSON.stringify(key)}:${this.stableStringify(item)}`);
            return `{${entries.join(',')}}`;
        }
        return JSON.stringify(value);
    }

    private toResponse(behavior: RawExternalBehaviorDocument) {
        return {
            id: behavior._id.toString(),
            dataSourceId: behavior.dataSourceId,
            sourceImportBatchId: behavior.sourceImportBatchId,
            sourceType: behavior.sourceType,
            sourceName: behavior.sourceName,
            permissionType: behavior.permissionType,
            permissionNote: behavior.permissionNote,
            externalId: behavior.externalId,
            externalUserRef: behavior.externalUserRef,
            occurredAt: behavior.occurredAt?.toISOString() ?? null,
            payload: behavior.payload,
            contentHash: behavior.contentHash,
            ingestedAt: behavior.ingestedAt.toISOString(),
            ingestedBy: behavior.ingestedBy,
            status: behavior.status,
            analysisError: behavior.analysisError,
            analyzedAt: behavior.analyzedAt?.toISOString() ?? null,
            createdAt: behavior.createdAt?.toISOString() ?? null,
            updatedAt: behavior.updatedAt?.toISOString() ?? null,
        };
    }
}
