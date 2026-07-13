import type { PaginatedResponse } from '../../types/api-response.type';
import type { Property } from '../properties/properties.types';

export type UserBehaviorEventType =
    | 'PROPERTY_VIEW'
    | 'PROPERTY_SAVE'
    | 'PROPERTY_UNSAVE'
    | 'INQUIRY_CREATED'
    | 'SEARCH'
    | 'FILTER_APPLIED'
    | 'RECOMMENDATION_VIEW'
    | 'RECOMMENDATION_CLICK'
    | 'RECOMMENDATION_SAVE'
    | 'RECOMMENDATION_DISMISS'
    | 'RECOMMENDATION_CONTACT';

export interface CreateUserBehaviorPayload {
    eventType: UserBehaviorEventType;
    propertyId?: string;
    demandId?: string;
    matchId?: string;
    keyword?: string;
    filters?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    eventKey?: string;
}

export interface UserBehaviorEvent {
    id: string;
    userId: string;
    eventType: UserBehaviorEventType;
    propertyId?: string | null;
    demandId?: string | null;
    matchId?: string | null;
    keyword?: string | null;
    filters?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    eventKey?: string | null;
    property?: Pick<Property, 'id' | 'title' | 'transactionType' | 'propertyType' | 'price' | 'area' | 'location'> | null;
    createdAt: string;
}

export interface UserBehaviorListQuery {
    page?: number;
    limit?: number;
    eventType?: UserBehaviorEventType;
}

export type UserBehaviorListResponse = PaginatedResponse<UserBehaviorEvent>;
