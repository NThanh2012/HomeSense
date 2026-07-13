import { PropertyType, TransactionType, UserBehaviorEventType } from '@prisma/client';

export interface PreferenceEventProperty {
    transactionType?: TransactionType | null;
    propertyType?: PropertyType | null;
    price?: number | null;
    area?: number | null;
    location?: {
        province?: string | null;
        district?: string | null;
        rawAddress?: string | null;
    } | null;
}

export interface PreferenceSourceEvent {
    eventType: UserBehaviorEventType;
    keyword?: string | null;
    filters?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    property?: PreferenceEventProperty | null;
    match?: {
        property?: PreferenceEventProperty | null;
    } | null;
}

export interface CalculatedUserPreference {
    preferredTransactionTypes: Record<string, number>;
    preferredPropertyTypes: Record<string, number>;
    preferredLocations: Record<string, number>;
    keywords: Record<string, number>;
    preferredMinPrice: number | null;
    preferredMaxPrice: number | null;
    preferredMinArea: number | null;
    preferredMaxArea: number | null;
}

const EVENT_WEIGHTS: Record<UserBehaviorEventType, number> = {
    PROPERTY_VIEW: 1,
    PROPERTY_SAVE: 4,
    PROPERTY_UNSAVE: -2,
    INQUIRY_CREATED: 6,
    SEARCH: 2,
    FILTER_APPLIED: 2,
    RECOMMENDATION_VIEW: 1,
    RECOMMENDATION_CLICK: 3,
    RECOMMENDATION_SAVE: 5,
    RECOMMENDATION_DISMISS: -3,
    RECOMMENDATION_CONTACT: 6,
};

export function calculateUserPreference(events: PreferenceSourceEvent[]): CalculatedUserPreference {
    const transactionTypes: Record<string, number> = {};
    const propertyTypes: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const keywords: Record<string, number> = {};
    const prices: number[] = [];
    const areas: number[] = [];

    for (const event of events) {
        const weight = EVENT_WEIGHTS[event.eventType] ?? 0;
        const property = event.property ?? event.match?.property ?? null;
        const filters = event.filters ?? {};

        addWeighted(transactionTypes, property?.transactionType, weight);
        addWeighted(transactionTypes, stringValue(filters.transactionType), weight);
        addWeighted(propertyTypes, property?.propertyType, weight);
        addWeighted(propertyTypes, stringValue(filters.propertyType), weight);

        const province = property?.location?.province ?? stringValue(filters.province);
        const district = property?.location?.district ?? stringValue(filters.district);
        addWeighted(locations, buildLocationKey(province, district), weight);

        addWeighted(keywords, event.keyword, weight);
        addWeighted(keywords, stringValue(filters.keyword), weight);
        addWeighted(keywords, stringValue(event.metadata?.keyword), weight);

        if (weight > 0) {
            addNumber(prices, property?.price);
            addNumber(prices, numberValue(filters.minPrice));
            addNumber(prices, numberValue(filters.maxPrice));
            addNumber(areas, property?.area);
            addNumber(areas, numberValue(filters.minArea));
            addNumber(areas, numberValue(filters.maxArea));
        }
    }

    return {
        preferredTransactionTypes: cleanScores(transactionTypes),
        preferredPropertyTypes: cleanScores(propertyTypes),
        preferredLocations: cleanScores(locations),
        keywords: cleanScores(keywords),
        preferredMinPrice: minOrNull(prices),
        preferredMaxPrice: maxOrNull(prices),
        preferredMinArea: minOrNull(areas),
        preferredMaxArea: maxOrNull(areas),
    };
}

function addWeighted(target: Record<string, number>, value: string | null | undefined, weight: number) {
    const normalized = normalizeKey(value);
    if (!normalized || weight === 0) {
        return;
    }

    target[normalized] = (target[normalized] ?? 0) + weight;
}

function cleanScores(source: Record<string, number>) {
    return Object.fromEntries(
        Object.entries(source)
            .filter(([, score]) => score > 0)
            .sort((a, b) => b[1] - a[1]),
    );
}

function buildLocationKey(province?: string | null, district?: string | null) {
    if (province && district) {
        return `${district}, ${province}`;
    }

    return province ?? district ?? null;
}

function normalizeKey(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized || null;
}

function stringValue(value: unknown) {
    return typeof value === 'string' ? value : null;
}

function numberValue(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function addNumber(target: number[], value: number | null | undefined) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        target.push(value);
    }
}

function minOrNull(values: number[]) {
    return values.length > 0 ? Math.min(...values) : null;
}

function maxOrNull(values: number[]) {
    return values.length > 0 ? Math.max(...values) : null;
}
