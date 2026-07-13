import { AdminUserDemand, DemandAnalysis } from '../admin-user-demands/admin-user-demands.types';

export type RawUserSignalStatus = 'NEW' | 'ANALYZED' | 'FAILED' | 'INVALID';

export type RawUserSignalConsentType =
    | 'PUBLIC_ALLOWED'
    | 'USER_PROVIDED'
    | 'AUTHORIZED_API'
    | 'PARTNER'
    | 'DEV_TEST';

export interface AdminUserSignal {
    id: string;
    sourceType: string;
    sourceName: string;
    sourceUrl?: string | null;
    externalId?: string | null;
    dataSourceId?: string | null;
    sourceImportBatchId?: string | null;
    permissionType?: string | null;
    externalUserRef?: string | null;
    content: string;
    contentHash: string;
    authorName?: string | null;
    authorPhone?: string | null;
    authorProfileUrl?: string | null;
    capturedAt: string;
    ingestedAt?: string | null;
    ingestedBy?: string | null;
    metadata?: Record<string, unknown> | null;
    status: RawUserSignalStatus;
    consentType: RawUserSignalConsentType;
    permissionNote?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminCreateUserSignalPayload {
    sourceType: string;
    sourceName: string;
    sourceUrl?: string;
    externalId?: string;
    externalUserRef?: string;
    content: string;
    authorName?: string;
    authorPhone?: string;
    authorProfileUrl?: string;
    capturedAt?: string;
    metadata?: Record<string, unknown>;
    consentType: RawUserSignalConsentType;
    permissionNote?: string;
}

export interface AdminUserSignalsQuery {
    page?: number;
    limit?: number;
    status?: RawUserSignalStatus;
    consentType?: RawUserSignalConsentType;
    sourceType?: string;
    keyword?: string;
}

export interface AdminCreateUserSignalResult {
    action: 'created' | 'updated';
    signal: AdminUserSignal;
}

export interface AdminUserSignalDetail {
    signal: AdminUserSignal;
    demand: AdminUserDemand | null;
    analyses: DemandAnalysis[];
}
