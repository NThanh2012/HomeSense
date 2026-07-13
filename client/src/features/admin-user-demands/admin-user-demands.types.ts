import { AuthUser } from '../auth/auth.types';
import { PropertyType } from '../properties/properties.types';

export type DemandType = 'BUY' | 'RENT' | 'SELL' | 'UNKNOWN';

export type UserDemandStatus = 'NEW' | 'ANALYZED' | 'MATCHED' | 'ARCHIVED' | 'INVALID';

export interface UserDemandSignalLink {
    id: string;
    userDemandId: string;
    rawUserSignalId: string;
    sourceType: string;
    sourceName: string;
    sourceUrl?: string | null;
    createdAt: string;
}

export interface DemandAnalysis {
    id: string;
    rawUserSignalId: string;
    userDemandId?: string | null;
    extractedDemandType: DemandType;
    extractedPropertyTypes: PropertyType[];
    extractedMinPrice?: number | null;
    extractedMaxPrice?: number | null;
    extractedMinArea?: number | null;
    extractedMaxArea?: number | null;
    extractedRawLocation?: string | null;
    extractedProvince?: string | null;
    extractedDistrict?: string | null;
    extractedPhone?: string | null;
    confidence: number;
    result: Record<string, unknown>;
    createdAt: string;
}

export interface AdminUserDemand {
    id: string;
    userId?: string | null;
    externalUserRef?: string | null;
    demandType: DemandType;
    propertyTypes: PropertyType[];
    minPrice?: number | null;
    maxPrice?: number | null;
    minArea?: number | null;
    maxArea?: number | null;
    province?: string | null;
    district?: string | null;
    ward?: string | null;
    rawLocation?: string | null;
    keywords: string[];
    contactPhone?: string | null;
    sourceConfidence: number;
    status: UserDemandStatus;
    user?: AuthUser | null;
    signals: UserDemandSignalLink[];
    latestAnalysis?: DemandAnalysis | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminUserDemandsQuery {
    page?: number;
    limit?: number;
    demandType?: DemandType;
    propertyType?: PropertyType;
    status?: UserDemandStatus;
    province?: string;
    district?: string;
    keyword?: string;
}

export interface AdminUpdateUserDemandStatusPayload {
    status: UserDemandStatus;
}

export interface DemandAnalysisResult {
    demand: AdminUserDemand;
    analysis: DemandAnalysis;
}
