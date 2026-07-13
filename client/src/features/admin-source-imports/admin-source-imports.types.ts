import { AdminDataSource } from '../admin-data-sources/admin-data-sources.types';

export type SourceImportTargetType = 'USER_SIGNAL' | 'EXTERNAL_BEHAVIOR';
export type SourceImportBatchTargetType = SourceImportTargetType | 'PROPERTY_POST';
export type SourceImportStatus = 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
export type SourceImportRecordStatus = 'CREATED' | 'SKIPPED' | 'FAILED';

export interface SourceImportRecord {
    id: string;
    batchId: string;
    recordIndex: number;
    rawRecordId?: string | null;
    externalId?: string | null;
    status: SourceImportRecordStatus;
    errorMessage?: string | null;
    createdAt: string;
}

export interface AdminSourceImportBatch {
    id: string;
    dataSourceId: string;
    importType: 'JSON';
    targetType: SourceImportBatchTargetType;
    status: SourceImportStatus;
    totalRecords: number;
    successCount: number;
    skippedCount: number;
    failedCount: number;
    errorMessage?: string | null;
    startedAt: string;
    finishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    dataSource: AdminDataSource;
    records?: SourceImportRecord[];
}

export interface AdminSourceImportsQuery {
    page?: number;
    limit?: number;
    dataSourceId?: string;
    targetType?: SourceImportBatchTargetType;
    status?: SourceImportStatus;
}

export interface AdminImportJsonPayload {
    dataSourceId: string;
    targetType: SourceImportTargetType;
    items: Record<string, unknown>[];
}
