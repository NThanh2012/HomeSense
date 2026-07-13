export type DataSourceType =
    | 'FACEBOOK'
    | 'WEBSITE'
    | 'PARTNER_API'
    | 'MANUAL_IMPORT'
    | 'USER_SUBMITTED'
    | 'PUBLIC_DATASET'
    | 'DEV_SYNTHETIC'
    | 'OTHER';

export type DataPermissionType =
    | 'AUTHORIZED_API'
    | 'PARTNER_AGREEMENT'
    | 'USER_SUBMITTED'
    | 'PUBLIC_ALLOWED'
    | 'DEV_SYNTHETIC'
    | 'UNKNOWN';

export interface AdminDataSource {
    id: string;
    name: string;
    sourceType: DataSourceType;
    platform?: string | null;
    baseUrl?: string | null;
    description?: string | null;
    permissionType: DataPermissionType;
    permissionNote: string;
    isActive: boolean;
    createdByUserId: string;
    createdBy?: {
        id: string;
        email: string;
        fullName?: string | null;
    };
    _count?: {
        importBatches: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface AdminDataSourcePayload {
    name: string;
    sourceType: DataSourceType;
    platform?: string;
    baseUrl?: string;
    description?: string;
    permissionType: DataPermissionType;
    permissionNote: string;
}

export type AdminUpdateDataSourcePayload = Omit<Partial<AdminDataSourcePayload>, 'sourceType'>;

export interface AdminDataSourcesQuery {
    page?: number;
    limit?: number;
    keyword?: string;
    sourceType?: DataSourceType;
    permissionType?: DataPermissionType;
    isActive?: boolean;
}
