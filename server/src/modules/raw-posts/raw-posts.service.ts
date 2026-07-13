import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DataPermissionType, DataSourceType } from '@prisma/client';
import { FilterQuery, Model, Types } from 'mongoose';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { CreateRawPostDto } from './dto/create-raw-post.dto.ts';
import { RawPost, RawPostDocument, RawPostStatus } from './schemas/raw-post.schema.ts';

export interface GovernedRawPostInput {
    dataSourceId: string;
    sourceImportBatchId: string;
    sourceType: DataSourceType;
    sourceName: string;
    permissionType: DataPermissionType;
    permissionNote: string;
    ingestedBy: string;
    externalId?: string;
    sourceUrl?: string;
    content: string;
    authorName?: string;
    authorPhone?: string;
    mediaUrls?: string[];
    capturedAt?: string;
    metadata?: Record<string, unknown>;
}

@Injectable()
export class RawPostsService {
    constructor(@InjectModel(RawPost.name) private readonly rawPostModel: Model<RawPostDocument>) {}

    async create(dto: CreateRawPostDto) {
        const rawPost = await this.rawPostModel.create(this.buildWritePayload(dto));

        return this.toResponse(rawPost);
    }

    async createOrUpdateBySource(dto: CreateRawPostDto) {
        const duplicateWhere = this.buildDuplicateWhere(dto);
        const payload = this.buildWritePayload(dto);

        if (duplicateWhere) {
            const existingRawPost = await this.rawPostModel
                .findOneAndUpdate(
                    duplicateWhere,
                    {
                        $set: payload,
                    },
                    {
                        new: true,
                        runValidators: true,
                    },
                )
                .exec();

            if (existingRawPost) {
                return {
                    action: 'updated' as const,
                    rawPost: this.toResponse(existingRawPost),
                };
            }
        }

        const rawPost = await this.rawPostModel.create(payload);

        return {
            action: 'created' as const,
            rawPost: this.toResponse(rawPost),
        };
    }

    async ingestGoverned(input: GovernedRawPostInput) {
        const contentHash = this.hashContent(input.content);
        const existing = await this.findGovernedDuplicate(input, contentHash);

        if (existing) {
            return {
                action: 'skipped' as const,
                rawPost: this.toResponse(existing),
            };
        }

        const rawPost = await this.rawPostModel.create({
            ...input,
            mediaUrls: input.mediaUrls ?? [],
            contentHash: contentHash,
            capturedAt: input.capturedAt ? new Date(input.capturedAt) : new Date(),
            ingestedAt: new Date(),
            status: RawPostStatus.NEW,
        });

        return {
            action: 'created' as const,
            rawPost: this.toResponse(rawPost),
        };
    }

    async findAll(query: PaginationQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.rawPostModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.rawPostModel.countDocuments().exec(),
        ]);

        return buildPaginatedResult(
            items.map((item) => this.toResponse(item)),
            page,
            limit,
            total,
        );
    }

    async findAllForAdmin(query: PaginationQueryDto & {
        status?: RawPostStatus;
        sourceType?: string;
        keyword?: string;
    }) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = this.buildAdminWhere(query);

        const [items, total] = await Promise.all([
            this.rawPostModel.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.rawPostModel.countDocuments(where).exec(),
        ]);

        return buildPaginatedResult(
            items.map((item) => this.toResponse(item)),
            page,
            limit,
            total,
        );
    }

    async countAll() {
        return this.rawPostModel.countDocuments().exec();
    }

    async findOne(id: string) {
        const rawPost = await this.findDocumentById(id);
        return this.toResponse(rawPost);
    }

    async findDocumentById(id: string): Promise<RawPostDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'Raw post id không hợp lệ');
        }

        const rawPost = await this.rawPostModel.findById(id).exec();
        if (!rawPost) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy raw post');
        }

        return rawPost;
    }

    async markAnalyzed(id: string) {
        await this.rawPostModel
            .updateOne(
                {
                    _id: id,
                },
                {
                    $set: {
                        status: RawPostStatus.ANALYZED,
                    },
                },
            )
            .exec();
    }

    private buildWritePayload(dto: CreateRawPostDto) {
        return {
            ...dto,
            mediaUrls: dto.mediaUrls ?? [],
            capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : new Date(),
            status: RawPostStatus.NEW,
        };
    }

    private buildDuplicateWhere(dto: CreateRawPostDto) {
        if (dto.externalId?.trim()) {
            return {
                sourceType: dto.sourceType,
                externalId: dto.externalId.trim(),
            };
        }

        if (dto.sourceUrl?.trim()) {
            return {
                sourceUrl: dto.sourceUrl.trim(),
            };
        }

        return null;
    }

    private async findGovernedDuplicate(input: GovernedRawPostInput, contentHash: string) {
        if (input.externalId?.trim()) {
            const byExternalId = await this.rawPostModel.findOne({
                dataSourceId: input.dataSourceId,
                externalId: input.externalId.trim(),
            });
            if (byExternalId) return byExternalId;
        }

        if (input.sourceUrl?.trim()) {
            const bySourceUrl = await this.rawPostModel.findOne({
                dataSourceId: input.dataSourceId,
                sourceUrl: input.sourceUrl.trim(),
            });
            if (bySourceUrl) return bySourceUrl;
        }

        return this.rawPostModel.findOne({
            dataSourceId: input.dataSourceId,
            contentHash: contentHash,
        });
    }

    private hashContent(content: string) {
        return createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
    }

    private buildAdminWhere(query: {
        status?: RawPostStatus;
        sourceType?: string;
        keyword?: string;
    }) {
        const where: FilterQuery<RawPostDocument> = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.sourceType) {
            where.sourceType = query.sourceType;
        }

        if (query.keyword) {
            const keyword = new RegExp(query.keyword, 'i');
            where.$or = [
                { content: keyword },
                { sourceName: keyword },
                { sourceUrl: keyword },
                { externalId: keyword },
                { authorName: keyword },
                { authorPhone: keyword },
            ];
        }

        return where;
    }

    private toResponse(rawPost: RawPostDocument) {
        return {
            id: rawPost._id.toString(),
            sourceType: rawPost.sourceType,
            sourceName: rawPost.sourceName,
            sourceUrl: rawPost.sourceUrl,
            externalId: rawPost.externalId,
            dataSourceId: rawPost.dataSourceId,
            sourceImportBatchId: rawPost.sourceImportBatchId,
            permissionType: rawPost.permissionType,
            permissionNote: rawPost.permissionNote,
            content: rawPost.content,
            contentHash: rawPost.contentHash,
            authorName: rawPost.authorName,
            authorPhone: rawPost.authorPhone,
            mediaUrls: rawPost.mediaUrls ?? [],
            status: rawPost.status,
            capturedAt: rawPost.capturedAt.toISOString(),
            ingestedAt: rawPost.ingestedAt?.toISOString(),
            ingestedBy: rawPost.ingestedBy,
            createdAt: rawPost.createdAt?.toISOString(),
            updatedAt: rawPost.updatedAt?.toISOString(),
            metadata: rawPost.metadata,
        };
    }
}
