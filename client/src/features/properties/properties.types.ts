export type TransactionType = 'SELL' | 'RENT' | 'UNKNOWN';

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'LAND' | 'VILLA' | 'ROOM' | 'UNKNOWN';

export type PropertyStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type PropertyMediaType = 'IMAGE' | 'VIDEO';

export type PropertySortBy = 'createdAt' | 'price' | 'area' | 'title';

export type PropertySortOrder = 'asc' | 'desc';

export interface PropertyLocation {
    id: string;
    province?: string | null;
    district?: string | null;
    ward?: string | null;
    street?: string | null;
    rawAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface PropertyMedia {
    id: string;
    propertyId: string;
    url: string;
    type: PropertyMediaType;
    sortOrder: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Property {
    id: string;
    title: string;
    description?: string | null;
    transactionType: TransactionType;
    propertyType: PropertyType;
    price?: number | null;
    area?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    furnishingStatus?: string | null;
    legalStatus?: string | null;
    direction?: string | null;
    amenities?: string[];
    latitude?: number | null;
    longitude?: number | null;
    nearbyPlaces?: Array<{
        id: string;
        category: string;
        name: string;
        distanceKm?: number | null;
    }>;
    contactPhone?: string | null;
    status: PropertyStatus;
    createdByUserId?: string | null;
    createdBy?: {
        id: string;
        email: string;
        fullName?: string | null;
        phone?: string | null;
    } | null;
    location?: PropertyLocation | null;
    media: PropertyMedia[];
    createdAt: string;
    updatedAt: string;
}

export interface PropertyListQuery {
    page?: number;
    limit?: number;
    keyword?: string;
    transactionType?: TransactionType;
    propertyType?: PropertyType;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    province?: string;
    district?: string;
    sortBy?: PropertySortBy;
    sortOrder?: PropertySortOrder;
}

export interface MyPropertyListQuery {
    page?: number;
    limit?: number;
}

export interface CreatePropertyPayload {
    title: string;
    description?: string;
    transactionType: TransactionType;
    propertyType: PropertyType;
    price?: number;
    area?: number;
    bedrooms?: number;
    bathrooms?: number;
    furnishingStatus?: string;
    legalStatus?: string;
    direction?: string;
    amenities?: string[];
    contactPhone?: string;
    mediaUrls?: string[];
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    rawAddress?: string;
    latitude?: number;
    longitude?: number;
}

export type UpdateMyPropertyPayload = Partial<CreatePropertyPayload>;
