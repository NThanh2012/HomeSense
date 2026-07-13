import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DataPermissionType, DataSourceType } from '@prisma/client';
import { FilterQuery, Model, Types } from 'mongoose';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { CreateUserSignalDto } from './dto/create-user-signal.dto.ts';
import { FilterUserSignalDto } from './dto/filter-user-signal.dto.ts';
import {
    RawUserSignal,
    RawUserSignalDocument,
    RawUserSignalStatus,
    RawUserSignalConsentType,
} from './schemas/raw-user-signal.schema.ts';

export interface GovernedRawUserSignalInput {
    dataSourceId: string;
    sourceImportBatchId: string;
    sourceType: DataSourceType;
    sourceName: string;
    permissionType: DataPermissionType;
    permissionNote: string;
    consentType: RawUserSignalConsentType;
    ingestedBy: string;
    externalId?: string;
    externalUserRef?: string;
    sourceUrl?: string;
    content: string;
    authorName?: string;
    authorPhone?: string;
    capturedAt?: string;
    metadata?: Record<string, unknown>;
}

@Injectable()
export class UserSignalsService {
    constructor(
        @InjectModel(RawUserSignal.name)
        private readonly rawUserSignalModel: Model<RawUserSignalDocument>,
        private readonly prisma: PrismaService,
    ) {}

    async createOrUpdateBySource(dto: CreateUserSignalDto) {
        const duplicateWhere = this.buildDuplicateWhere(dto);
        const payload = this.buildWritePayload(dto);

        if (duplicateWhere) {
            const existingSignal = await this.rawUserSignalModel
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

            if (existingSignal) {
                return {
                    action: 'updated' as const,
                    signal: this.toResponse(existingSignal),
                };
            }
        }

        const signal = await this.rawUserSignalModel.create(payload);

        return {
            action: 'created' as const,
            signal: this.toResponse(signal),
        };
    }

    async ingestGoverned(input: GovernedRawUserSignalInput) {
        const contentHash = this.hashContent(input.content);
        const existing = await this.findGovernedDuplicate(input, contentHash);

        if (existing) {
            return {
                action: 'skipped' as const,
                signal: this.toResponse(existing),
            };
        }

        const signal = await this.rawUserSignalModel.create({
            ...input,
            contentHash: contentHash,
            capturedAt: input.capturedAt ? new Date(input.capturedAt) : new Date(),
            ingestedAt: new Date(),
            status: RawUserSignalStatus.NEW,
        });

        return {
            action: 'created' as const,
            signal: this.toResponse(signal),
        };
    }

    async findAll(query: FilterUserSignalDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = this.buildWhere(query);

        const [items, total] = await Promise.all([
            this.rawUserSignalModel.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.rawUserSignalModel.countDocuments(where).exec(),
        ]);

        return buildPaginatedResult(
            items.map((item) => this.toResponse(item)),
            page,
            limit,
            total,
        );
    }

    async findOne(id: string) {
        const signal = await this.findDocumentById(id);
        return this.toResponse(signal);
    }

    async findDetail(id: string) {
        const signal = await this.findOne(id);
        const link = await this.prisma.userDemandSignal.findUnique({
            where: {
                rawUserSignalId: id,
            },
            include: {
                userDemand: true,
            },
        });
        const analyses = await this.prisma.demandAnalysis.findMany({
            where: {
                rawUserSignalId: id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            signal: signal,
            demand: link ? this.toDemandResponse(link.userDemand) : null,
            analyses: analyses.map((analysis) => this.toAnalysisResponse(analysis)),
        };
    }

    async findDocumentById(id: string): Promise<RawUserSignalDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new ApiException(ResponseCode.INVALID_PARAMETER_VALUE, 'User signal id không hợp lệ');
        }

        const signal = await this.rawUserSignalModel.findById(id).exec();

        if (!signal) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy tín hiệu nhu cầu');
        }

        return signal;
    }

    async markAnalyzed(id: string) {
        await this.updateStatus(id, RawUserSignalStatus.ANALYZED);
    }

    async markInvalid(id: string) {
        await this.updateStatus(id, RawUserSignalStatus.INVALID);
    }

    async markFailed(id: string) {
        await this.updateStatus(id, RawUserSignalStatus.FAILED);
    }

    private async updateStatus(id: string, status: RawUserSignalStatus) {
        await this.rawUserSignalModel
            .updateOne(
                {
                    _id: id,
                },
                {
                    $set: {
                        status: status,
                    },
                },
            )
            .exec();
    }

    private buildWritePayload(dto: CreateUserSignalDto) {
        return {
            ...dto,
            contentHash: this.hashContent(dto.content),
            capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : new Date(),
            status: RawUserSignalStatus.NEW,
        };
    }

    private buildDuplicateWhere(dto: CreateUserSignalDto) {
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

        return {
            contentHash: this.hashContent(dto.content),
        };
    }

    private async findGovernedDuplicate(input: GovernedRawUserSignalInput, contentHash: string) {
        if (input.externalId?.trim()) {
            const byExternalId = await this.rawUserSignalModel.findOne({
                dataSourceId: input.dataSourceId,
                externalId: input.externalId.trim(),
            });
            if (byExternalId) return byExternalId;
        }

        if (input.sourceUrl?.trim()) {
            const bySourceUrl = await this.rawUserSignalModel.findOne({
                dataSourceId: input.dataSourceId,
                sourceUrl: input.sourceUrl.trim(),
            });
            if (bySourceUrl) return bySourceUrl;
        }

        return this.rawUserSignalModel.findOne({
            dataSourceId: input.dataSourceId,
            contentHash: contentHash,
        });
    }

    private hashContent(content: string) {
        return createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
    }

    private buildWhere(query: FilterUserSignalDto) {
        const where: FilterQuery<RawUserSignalDocument> = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.consentType) {
            where.consentType = query.consentType;
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
                { externalUserRef: keyword },
                { authorName: keyword },
                { authorPhone: keyword },
            ];
        }

        return where;
    }

    private toResponse(signal: RawUserSignalDocument) {
        return {
            id: signal._id.toString(),
            sourceType: signal.sourceType,
            sourceName: signal.sourceName,
            sourceUrl: signal.sourceUrl,
            externalId: signal.externalId,
            dataSourceId: signal.dataSourceId,
            sourceImportBatchId: signal.sourceImportBatchId,
            permissionType: signal.permissionType,
            externalUserRef: signal.externalUserRef,
            content: signal.content,
            contentHash: signal.contentHash,
            authorName: signal.authorName,
            authorPhone: signal.authorPhone,
            authorProfileUrl: signal.authorProfileUrl,
            capturedAt: signal.capturedAt.toISOString(),
            ingestedAt: signal.ingestedAt?.toISOString(),
            ingestedBy: signal.ingestedBy,
            metadata: signal.metadata,
            status: signal.status,
            consentType: signal.consentType,
            permissionNote: signal.permissionNote,
            createdAt: signal.createdAt?.toISOString(),
            updatedAt: signal.updatedAt?.toISOString(),
        };
    }

    private toDemandResponse(demand: any) {
        return {
            ...demand,
            minPrice: demand.minPrice === null ? null : Number(demand.minPrice),
            maxPrice: demand.maxPrice === null ? null : Number(demand.maxPrice),
            createdAt: demand.createdAt.toISOString(),
            updatedAt: demand.updatedAt.toISOString(),
        };
    }

    private toAnalysisResponse(analysis: any) {
        return {
            ...analysis,
            extractedMinPrice:
                analysis.extractedMinPrice === null ? null : Number(analysis.extractedMinPrice),
            extractedMaxPrice:
                analysis.extractedMaxPrice === null ? null : Number(analysis.extractedMaxPrice),
            createdAt: analysis.createdAt.toISOString(),
        };
    }
}
