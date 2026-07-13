import { Injectable, Optional } from '@nestjs/common';
import {
    DataPermissionType,
    Prisma,
    SourceImportRecordStatus,
    SourceImportStatus,
    SourceImportTargetType,
    SourceImportType,
    LearningJobPriority,
    LearningJobType,
} from '@prisma/client';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { ResponseCode } from '../../common/constants/response-code.constant.ts';
import { ApiException } from '../../common/exceptions/api.exception.ts';
import { buildPaginatedResult } from '../../common/utils/pagination.util.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { DataSourcesService } from '../data-sources/data-sources.service.ts';
import { ExternalBehaviorsService } from '../external-behaviors/external-behaviors.service.ts';
import { ImportExternalBehaviorItemDto } from '../external-behaviors/dto/import-external-behavior-item.dto.ts';
import { RawUserSignalConsentType } from '../user-signals/schemas/raw-user-signal.schema.ts';
import { UserSignalsService } from '../user-signals/user-signals.service.ts';
import { FilterSourceImportDto } from './dto/filter-source-import.dto.ts';
import { IMPORTABLE_SOURCE_TARGET_TYPES, ImportJsonDto } from './dto/import-json.dto.ts';
import { ImportUserSignalItemDto } from './dto/import-user-signal-item.dto.ts';
import { LearningJobsService } from '../learning-jobs/learning-jobs.service.ts';
import {
    EXTERNAL_BEHAVIOR_SOURCE_POLICY_MESSAGE,
    isExternalBehaviorSourceAllowed,
} from '../../shared/utils/external-behavior-source-policy.util.ts';

@Injectable()
export class SourceImportsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dataSourcesService: DataSourcesService,
        private readonly userSignalsService: UserSignalsService,
        private readonly externalBehaviorsService: ExternalBehaviorsService,
        @Optional() private readonly learningJobsService?: LearningJobsService,
    ) {}

    async importJson(userId: string, dto: ImportJsonDto) {
        if (!IMPORTABLE_SOURCE_TARGET_TYPES.includes(dto.targetType as any)) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Không hỗ trợ import tin đăng bất động sản; người bán phải tự tạo tin trên website',
            );
        }

        const source = await this.dataSourcesService.findActiveForImport(dto.dataSourceId);
        const batch = await this.prisma.sourceImportBatch.create({
            data: {
                dataSourceId: source.id,
                importType: SourceImportType.JSON,
                targetType: dto.targetType,
                status: SourceImportStatus.PROCESSING,
                totalRecords: dto.items.length,
                createdByUserId: userId,
            },
        });

        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for (const [index, item] of dto.items.entries()) {
            const validation = this.validateItem(dto.targetType, item);

            if (!validation.valid) {
                failedCount += 1;
                await this.createRecord(batch.id, index, item.externalId, {
                    status: SourceImportRecordStatus.FAILED,
                    errorMessage: validation.error,
                });
                continue;
            }

            try {
                const result = await this.ingestItem(
                    userId,
                    batch.id,
                    source,
                    dto.targetType,
                    validation.item,
                );
                const status =
                    result.action === 'created'
                        ? SourceImportRecordStatus.CREATED
                        : SourceImportRecordStatus.SKIPPED;

                if (status === SourceImportRecordStatus.CREATED) successCount += 1;
                if (status === SourceImportRecordStatus.SKIPPED) skippedCount += 1;

                await this.createRecord(batch.id, index, item.externalId, {
                    status: status,
                    rawRecordId: result.rawRecordId,
                });
            } catch (error) {
                failedCount += 1;
                await this.createRecord(batch.id, index, item.externalId, {
                    status: SourceImportRecordStatus.FAILED,
                    errorMessage: error instanceof Error ? error.message : 'Không thể import record',
                });
            }
        }

        const status = this.getBatchStatus(successCount, skippedCount, failedCount);
        await this.prisma.sourceImportBatch.update({
            where: { id: batch.id },
            data: {
                status: status,
                successCount: successCount,
                skippedCount: skippedCount,
                failedCount: failedCount,
                finishedAt: new Date(),
            },
        });

        if (dto.targetType === SourceImportTargetType.EXTERNAL_BEHAVIOR && successCount > 0) {
            await this.queueLinkedUsers(dto.dataSourceId, dto.items);
        }

        return this.findOne(batch.id);
    }

    async findAll(query: FilterSourceImportDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where: Prisma.SourceImportBatchWhereInput = {};

        if (query.dataSourceId) where.dataSourceId = query.dataSourceId;
        if (query.targetType) where.targetType = query.targetType;
        if (query.status) where.status = query.status;

        const [items, total] = await Promise.all([
            this.prisma.sourceImportBatch.findMany({
                where: where,
                include: {
                    dataSource: true,
                    createdBy: {
                        select: { id: true, email: true, fullName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.sourceImportBatch.count({ where: where }),
        ]);

        return buildPaginatedResult(items, page, limit, total);
    }

    async findOne(id: string) {
        const batch = await this.prisma.sourceImportBatch.findUnique({
            where: { id: id },
            include: {
                dataSource: true,
                createdBy: {
                    select: { id: true, email: true, fullName: true },
                },
                records: {
                    orderBy: { recordIndex: 'asc' },
                },
            },
        });

        if (!batch) {
            throw new ApiException(ResponseCode.RESOURCE_NOT_FOUND, 'Không tìm thấy batch import');
        }

        return batch;
    }

    private validateItem(targetType: SourceImportTargetType, item: Record<string, unknown>) {
        if (targetType === SourceImportTargetType.USER_SIGNAL) {
            return this.validateDto(ImportUserSignalItemDto, item);
        }

        const payloadBytes = Buffer.byteLength(JSON.stringify(item.payload ?? null), 'utf8');
        if (payloadBytes > 65_536) {
            return {
                valid: false as const,
                error: 'Payload external behavior không được vượt quá 64KB',
            };
        }

        return this.validateDto(ImportExternalBehaviorItemDto, item);
    }

    private validateDto<T extends object>(
        ItemDto: ClassConstructor<T>,
        item: Record<string, unknown>,
    ) {
        const instance = plainToInstance(ItemDto, item);
        const errors = validateSync(instance, {
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: false,
        });

        if (errors.length > 0) {
            return {
                valid: false as const,
                error: this.formatValidationErrors(errors),
            };
        }

        return {
            valid: true as const,
            item: instance,
        };
    }

    private async ingestItem(
        userId: string,
        batchId: string,
        source: Awaited<ReturnType<DataSourcesService['findActiveForImport']>>,
        targetType: SourceImportTargetType,
        item: ImportUserSignalItemDto | ImportExternalBehaviorItemDto,
    ) {
        const governance = {
            dataSourceId: source.id,
            sourceImportBatchId: batchId,
            sourceType: source.sourceType,
            sourceName: source.name,
            permissionType: source.permissionType,
            permissionNote: source.permissionNote,
            ingestedBy: userId,
        };

        if (targetType === SourceImportTargetType.EXTERNAL_BEHAVIOR) {
            if (!isExternalBehaviorSourceAllowed(source.sourceType, source.permissionType)) {
                throw new ApiException(
                    ResponseCode.INVALID_PARAMETER_VALUE,
                    EXTERNAL_BEHAVIOR_SOURCE_POLICY_MESSAGE,
                );
            }
            const result = await this.externalBehaviorsService.ingestGoverned({
                ...governance,
                ...(item as ImportExternalBehaviorItemDto),
            });
            return { action: result.action, rawRecordId: result.behavior.id };
        }

        const result = await this.userSignalsService.ingestGoverned({
            ...governance,
            ...(item as ImportUserSignalItemDto),
            consentType: this.mapPermissionToConsent(source.permissionType),
        });
        return { action: result.action, rawRecordId: result.signal.id };
    }

    private mapPermissionToConsent(permissionType: DataPermissionType) {
        const map: Record<Exclude<DataPermissionType, 'UNKNOWN'>, RawUserSignalConsentType> = {
            [DataPermissionType.AUTHORIZED_API]: RawUserSignalConsentType.AUTHORIZED_API,
            [DataPermissionType.PARTNER_AGREEMENT]: RawUserSignalConsentType.PARTNER,
            [DataPermissionType.USER_SUBMITTED]: RawUserSignalConsentType.USER_PROVIDED,
            [DataPermissionType.PUBLIC_ALLOWED]: RawUserSignalConsentType.PUBLIC_ALLOWED,
            [DataPermissionType.DEV_SYNTHETIC]: RawUserSignalConsentType.DEV_TEST,
        };

        if (permissionType === DataPermissionType.UNKNOWN) {
            throw new ApiException(
                ResponseCode.INVALID_PARAMETER_VALUE,
                'Nguồn dữ liệu chưa có quyền sử dụng hợp lệ',
            );
        }

        return map[permissionType];
    }

    private async queueLinkedUsers(dataSourceId: string, items: Array<Record<string, unknown>>) {
        if (!this.learningJobsService) return;
        const externalUserRefs = Array.from(
            new Set(
                items
                    .map((item) => item.externalUserRef)
                    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
                    .map((value) => value.trim()),
            ),
        );
        if (externalUserRefs.length === 0) return;
        const links = await this.prisma.externalUserLink.findMany({
            where: {
                dataSourceId,
                externalUserRef: { in: externalUserRefs },
                isActive: true,
            },
            select: { userId: true },
        });
        for (const userId of new Set(links.map((link) => link.userId))) {
            await this.learningJobsService.enqueueForUser(userId, LearningJobType.EXTERNAL_LEARNING, {
                priority: LearningJobPriority.HIGH,
                reason: 'external_import',
            });
        }
    }

    private createRecord(
        batchId: string,
        recordIndex: number,
        externalId: unknown,
        data: {
            status: SourceImportRecordStatus;
            rawRecordId?: string;
            errorMessage?: string;
        },
    ) {
        return this.prisma.sourceImportRecord.create({
            data: {
                batchId: batchId,
                recordIndex: recordIndex,
                externalId: typeof externalId === 'string' ? externalId : undefined,
                ...data,
            },
        });
    }

    private getBatchStatus(successCount: number, skippedCount: number, failedCount: number) {
        if (failedCount === 0) return SourceImportStatus.COMPLETED;
        if (successCount + skippedCount > 0) return SourceImportStatus.PARTIAL;
        return SourceImportStatus.FAILED;
    }

    private formatValidationErrors(errors: ValidationError[]) {
        const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));
        return messages[0] ?? 'Record import không hợp lệ';
    }
}
