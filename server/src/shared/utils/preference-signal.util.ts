import {
    PreferenceSignalType,
    TransactionType,
    UserBehaviorEventType,
} from '@prisma/client';

export interface CanonicalSignalDraft {
    signalType: PreferenceSignalType;
    value: Record<string, unknown>;
    baseWeight: number;
}

export interface BehaviorSignalInput {
    eventType: UserBehaviorEventType;
    keyword?: string | null;
    filters?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    property?: {
        transactionType?: string | null;
        propertyType?: string | null;
        price?: number | null;
        area?: number | null;
        bedrooms?: number | null;
        bathrooms?: number | null;
        furnishingStatus?: string | null;
        legalStatus?: string | null;
        direction?: string | null;
        amenities?: string[];
        location?: {
            province?: string | null;
            district?: string | null;
            rawAddress?: string | null;
        } | null;
    } | null;
}

const EVENT_WEIGHTS: Record<UserBehaviorEventType, number> = {
    PROPERTY_VIEW: 1,
    PROPERTY_SAVE: 4,
    PROPERTY_UNSAVE: -3,
    INQUIRY_CREATED: 6,
    SEARCH: 3,
    FILTER_APPLIED: 2.5,
    RECOMMENDATION_VIEW: 0.5,
    RECOMMENDATION_CLICK: 2,
    RECOMMENDATION_SAVE: 4,
    RECOMMENDATION_DISMISS: -6,
    RECOMMENDATION_CONTACT: 6,
};

const ALLOWED_FILTERS: Array<[string, PreferenceSignalType]> = [
    ['transactionType', PreferenceSignalType.TRANSACTION_TYPE],
    ['propertyType', PreferenceSignalType.PROPERTY_TYPE],
    ['province', PreferenceSignalType.LOCATION],
    ['district', PreferenceSignalType.LOCATION],
    ['minPrice', PreferenceSignalType.PRICE_RANGE],
    ['maxPrice', PreferenceSignalType.PRICE_RANGE],
    ['minArea', PreferenceSignalType.AREA_RANGE],
    ['maxArea', PreferenceSignalType.AREA_RANGE],
    ['bedrooms', PreferenceSignalType.BEDROOMS],
    ['bathrooms', PreferenceSignalType.BATHROOMS],
    ['furnishingStatus', PreferenceSignalType.FURNISHING],
    ['legalStatus', PreferenceSignalType.LEGAL_STATUS],
    ['direction', PreferenceSignalType.DIRECTION],
    ['amenity', PreferenceSignalType.AMENITY],
    ['nearbyPlace', PreferenceSignalType.NEARBY_PLACE],
];

export function buildCanonicalSignals(input: BehaviorSignalInput): CanonicalSignalDraft[] {
    const weight = EVENT_WEIGHTS[input.eventType] ?? 1;
    const context = buildContext(input);
    const drafts: CanonicalSignalDraft[] = [];

    addDraft(drafts, PreferenceSignalType.KEYWORD, input.keyword, weight, context);

    for (const [key, type] of ALLOWED_FILTERS) {
        addDraft(drafts, type, input.filters?.[key], weight, context, key);
    }

    const property = input.property;
    if (property) {
        addDraft(drafts, PreferenceSignalType.TRANSACTION_TYPE, property.transactionType, weight, context);
        addDraft(drafts, PreferenceSignalType.PROPERTY_TYPE, property.propertyType, weight, context);
        addDraft(drafts, PreferenceSignalType.PRICE_RANGE, property.price, weight, context, 'price');
        addDraft(drafts, PreferenceSignalType.AREA_RANGE, property.area, weight, context, 'area');
        addDraft(drafts, PreferenceSignalType.BEDROOMS, property.bedrooms, weight, context);
        addDraft(drafts, PreferenceSignalType.BATHROOMS, property.bathrooms, weight, context);
        addDraft(drafts, PreferenceSignalType.FURNISHING, property.furnishingStatus, weight, context);
        addDraft(drafts, PreferenceSignalType.LEGAL_STATUS, property.legalStatus, weight, context);
        addDraft(drafts, PreferenceSignalType.DIRECTION, property.direction, weight, context);
        for (const amenity of property.amenities ?? []) {
            addDraft(drafts, PreferenceSignalType.AMENITY, amenity, weight, context);
        }
        addDraft(drafts, PreferenceSignalType.LOCATION, property.location?.province, weight, context, 'province');
        addDraft(drafts, PreferenceSignalType.LOCATION, property.location?.district, weight, context, 'district');
    }

    return dedupeDrafts(drafts);
}

export function calculateEffectiveSignalWeight(
    signalType: PreferenceSignalType,
    baseWeight: number,
    occurredAt: Date,
    now = new Date(),
    eventType?: UserBehaviorEventType | string | null,
) {
    const ageDays = Math.max(0, (now.getTime() - occurredAt.getTime()) / 86_400_000);
    const halfLifeDays = getHalfLifeDays(signalType, eventType);
    if (!Number.isFinite(halfLifeDays)) return baseWeight;
    return baseWeight * 2 ** (-ageDays / halfLifeDays);
}

export function buildIntentKey(value: unknown) {
    const object = asObject(value);
    const context = asObject(object.context);
    const transactionType = normalizeText(context.transactionType) || TransactionType.UNKNOWN;
    const propertyType = normalizeText(context.propertyType) || 'ANY';
    const district = normalizeText(context.district) || 'ANY';
    const province = normalizeText(context.province) || 'ANY';
    return [transactionType, propertyType, district, province].join(':').toLowerCase();
}

function buildContext(input: BehaviorSignalInput) {
    const filters = input.filters ?? {};
    const location = input.property?.location;
    return {
        transactionType:
            normalizeText(filters.transactionType) ||
            normalizeText(input.property?.transactionType) ||
            TransactionType.UNKNOWN,
        propertyType: normalizeText(filters.propertyType) || normalizeText(input.property?.propertyType),
        province: normalizeText(filters.province) || normalizeText(location?.province),
        district: normalizeText(filters.district) || normalizeText(location?.district),
        eventType: input.eventType,
    };
}

function addDraft(
    drafts: CanonicalSignalDraft[],
    signalType: PreferenceSignalType,
    rawValue: unknown,
    baseWeight: number,
    context: Record<string, unknown>,
    field?: string,
) {
    const value = normalizeValue(rawValue);
    if (value === null || value === TransactionType.UNKNOWN || value === 'UNKNOWN') return;
    drafts.push({
        signalType,
        baseWeight,
        value: {
            value,
            ...(field ? { field } : {}),
            context,
        },
    });
}

function normalizeValue(value: unknown): string | number | boolean | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return normalizeText(value);
    return null;
}

function normalizeText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

function dedupeDrafts(drafts: CanonicalSignalDraft[]) {
    const unique = new Map<string, CanonicalSignalDraft>();
    for (const draft of drafts) {
        unique.set(`${draft.signalType}:${JSON.stringify(draft.value)}`, draft);
    }
    return Array.from(unique.values());
}

function getHalfLifeDays(signalType: PreferenceSignalType, eventType?: UserBehaviorEventType | string | null) {
    if (eventType === UserBehaviorEventType.RECOMMENDATION_DISMISS) return Number.POSITIVE_INFINITY;
    if (eventType === UserBehaviorEventType.PROPERTY_VIEW || eventType === UserBehaviorEventType.RECOMMENDATION_VIEW) return 7;
    if (eventType === UserBehaviorEventType.SEARCH || eventType === UserBehaviorEventType.FILTER_APPLIED) return 21;
    if (eventType === UserBehaviorEventType.PROPERTY_SAVE || eventType === UserBehaviorEventType.RECOMMENDATION_SAVE) return 45;
    if (
        eventType === UserBehaviorEventType.INQUIRY_CREATED ||
        eventType === UserBehaviorEventType.RECOMMENDATION_CONTACT
    ) return 60;
    if (signalType === PreferenceSignalType.LOCATION_ANCHOR) return 90;
    if (
        signalType === PreferenceSignalType.TRANSACTION_TYPE ||
        signalType === PreferenceSignalType.PROPERTY_TYPE ||
        signalType === PreferenceSignalType.LOCATION ||
        signalType === PreferenceSignalType.KEYWORD
    ) {
        return 21;
    }
    return 45;
}

function asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}
