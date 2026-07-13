export type LearningJobType = 'EXTERNAL_LEARNING' | 'RECOMMENDATION_RECOMPUTE' | 'RAW_CLEANUP';
export type LearningJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';

export interface LearningJob {
    id: string;
    type: LearningJobType;
    status: LearningJobStatus;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'IMMEDIATE';
    userId: string | null;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    availableAt: string;
    leaseExpiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    items?: LearningJobItem[];
}

export interface LearningJobItem {
    id: string;
    rawRecordId: string | null;
    status: string;
    errorMessage: string | null;
}

export interface ExternalBehavior {
    id: string;
    dataSourceId: string;
    externalUserRef: string;
    status: 'PENDING' | 'ANALYZED' | 'REVIEW_REQUIRED' | 'FAILED';
    occurredAt: string | null;
    analysisError: string | null;
    createdAt: string | null;
}

export interface ExternalUserLink {
    id: string;
    dataSourceId: string;
    externalUserRef: string;
    userId: string;
    isActive: boolean;
    dataSource: {
        id: string;
        name: string;
        sourceType: string;
        permissionType: string;
    };
    user: {
        id: string;
        email: string;
        fullName?: string | null;
    };
    linkedBy: {
        id: string;
        email: string;
        fullName?: string | null;
    };
    createdAt: string;
    updatedAt: string;
}

export interface UserIntent {
    id: string;
    intentKey: string;
    demandType: string;
    propertyTypes: string[];
    province: string | null;
    district: string | null;
    strength: number;
    status: string;
    signalCount: number;
}

export interface PreferenceSignal {
    id: string;
    signalType: string;
    source: string;
    baseWeight: number;
    effectiveWeight: number;
    occurredAt: string;
}
