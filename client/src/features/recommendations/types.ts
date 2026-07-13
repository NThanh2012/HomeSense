import type { PropertyType, TransactionType } from '../properties/properties.types';

export interface DemandMatchProperty {
    id: string;
    title: string;
    transactionType: TransactionType;
    propertyType: PropertyType;
    price: number | null;
    area: number | null;
    status: string;
    thumbnail: string | null;
    location: {
        province: string | null;
        district: string | null;
        rawAddress: string | null;
    } | null;
}

export interface DemandPropertyMatch {
    id: string;
    demandId: string;
    propertyId: string;
    matchScore: number;
    matchReasons: string[];
    scoreBreakdown: {
        transactionType: number;
        propertyType: number;
        price: number;
        area: number;
        location: number;
        keyword: number;
        behaviorBoost?: number;
    };
    status: DemandMatchStatus;
    property: DemandMatchProperty | null;
    createdAt: string;
    updatedAt: string;
}

export type DemandMatchStatus = 'ACTIVE' | 'DISMISSED' | 'CONTACTED' | 'OUTDATED';

export interface RunMatchingResult {
    matched: number;
    topMatches: Array<{
        propertyId: string;
        matchScore: number;
        matchReasons: string[];
    }>;
}

export interface DemandMatchListQuery {
    page?: number;
    limit?: number;
    minScore?: number;
    status?: DemandMatchStatus;
}

export interface UpdateDemandMatchStatusPayload {
    status: DemandMatchStatus;
}

export type RecommendationFeedbackType = 'VIEWED' | 'CLICKED' | 'SAVED' | 'DISMISSED' | 'CONTACTED';

export interface CreateRecommendationFeedbackPayload {
    feedbackType: RecommendationFeedbackType;
    metadata?: Record<string, unknown>;
}

export interface RecommendationFeedbackResult {
    feedback: {
        id: string;
        eventType: string;
        createdAt?: string;
    };
    match: DemandPropertyMatch;
}

export interface RecomputeRecommendationsResult {
    profile: unknown;
    demandCount: number;
    matchedCount: number;
}
