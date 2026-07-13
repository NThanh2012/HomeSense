import { PropertyStatus, PropertyType, TransactionType } from '@prisma/client';

export class PropertyResponseDto {
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
    nearbyPlaces?: unknown[];
    contactPhone?: string | null;
    status: PropertyStatus;
    createdByUserId?: string | null;
    createdBy?: unknown;
    location?: unknown;
    media?: unknown[];
    createdAt: string;
    updatedAt: string;
}
