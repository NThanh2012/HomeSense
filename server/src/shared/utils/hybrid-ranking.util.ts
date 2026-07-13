import {
    DemandMatchStatus,
    PreferenceSignalType,
    PropertyStatus,
    UserBehaviorEventType,
} from '@prisma/client';
import { MatchableProperty, MatchResult, ScoreBreakdown } from './property-matcher.util.ts';

export interface HybridRankingPreferenceProfile {
    preferredTransactionTypes?: unknown;
    preferredPropertyTypes?: unknown;
    preferredLocations?: unknown;
    preferredMinPrice?: unknown;
    preferredMaxPrice?: unknown;
    preferredMinArea?: unknown;
    preferredMaxArea?: unknown;
}

export interface HybridRankingFeedbackEvent {
    eventType: UserBehaviorEventType;
    propertyId?: string | null;
    createdAt?: Date | string | null;
}

export interface HybridRankingContext {
    preferenceProfile?: HybridRankingPreferenceProfile | null;
    previousStatus?: DemandMatchStatus | null;
    feedbackEvents?: HybridRankingFeedbackEvent[];
    canonicalSignals?: Array<{
        signalType: PreferenceSignalType;
        value: unknown;
        effectiveWeight: number;
    }>;
    intent?: {
        strength?: number | null;
        lastSignalAt?: Date | string | null;
    } | null;
    locationAnchors?: Array<{
        province?: string | null;
        district?: string | null;
        rawLocation?: string | null;
        baseWeight?: number | null;
    }>;
    now?: Date;
}

export interface HybridScoreBreakdown extends ScoreBreakdown {
    baseMatchScore: number;
    preferenceBoost: number;
    feedbackBoost: number;
    freshnessBoost: number;
    statusPenalty: number;
    intentBoost: number;
    contextAnchorBoost: number;
    featureBoost: number;
    timeDecayWeight: number;
    behaviorBoost: number;
    finalScore: number;
}

export interface HybridRankedMatch extends MatchResult {
    matchScore: number;
    scoreBreakdown: HybridScoreBreakdown;
}

export function rankHybridMatch(
    match: MatchResult,
    property: MatchableProperty | null,
    context: HybridRankingContext = {},
): HybridRankedMatch | null {
    if (!property || property.status !== PropertyStatus.PUBLISHED) {
        return null;
    }

    const baseMatchScore = clamp(match.matchScore, 0, 100);
    const preferenceResult = calculatePreferenceBoost(property, context.preferenceProfile);
    const feedbackResult = calculateFeedbackBoost(context.feedbackEvents ?? []);
    const freshnessResult = calculateFreshnessBoost(property.updatedAt, context.now ?? new Date());
    const statusResult = calculateStatusPenalty(context.previousStatus);
    const intentResult = calculateIntentBoost(context.intent, context.now ?? new Date());
    const anchorResult = calculateAnchorBoost(property, context.locationAnchors ?? []);
    const featureResult = calculateFeatureBoost(property, context.canonicalSignals ?? []);
    const finalScore = clamp(
        baseMatchScore +
            preferenceResult.score +
            feedbackResult.score +
            freshnessResult.score +
            statusResult.score +
            intentResult.score +
            anchorResult.score +
            featureResult.score,
        0,
        100,
    );
    const behaviorBoost =
        preferenceResult.score + feedbackResult.score + freshnessResult.score + statusResult.score;
    const timeDecayWeight = featureResult.timeDecayWeight;

    return {
        ...match,
        matchScore: finalScore,
        matchReasons: [
            ...match.matchReasons,
            ...preferenceResult.reasons,
            ...feedbackResult.reasons,
            ...freshnessResult.reasons,
            ...statusResult.reasons,
            ...intentResult.reasons,
            ...anchorResult.reasons,
            ...featureResult.reasons,
        ],
        scoreBreakdown: {
            ...match.scoreBreakdown,
            baseMatchScore: baseMatchScore,
            preferenceBoost: preferenceResult.score,
            feedbackBoost: feedbackResult.score,
            freshnessBoost: freshnessResult.score,
            statusPenalty: statusResult.score,
            intentBoost: intentResult.score,
            contextAnchorBoost: anchorResult.score,
            featureBoost: featureResult.score,
            timeDecayWeight: timeDecayWeight,
            behaviorBoost: behaviorBoost,
            finalScore: finalScore,
        },
    };
}

function calculateIntentBoost(
    intent: HybridRankingContext['intent'],
    now: Date,
) {
    if (!intent) return { score: 0, reasons: [] as string[] };
    const lastSignalAt = intent.lastSignalAt ? new Date(intent.lastSignalAt) : null;
    const ageDays = lastSignalAt
        ? Math.max(0, (now.getTime() - lastSignalAt.getTime()) / 86_400_000)
        : 365;
    const recency = 2 ** (-ageDays / 30);
    const score = clamp(Math.round(Math.min(5, Math.abs(Number(intent.strength ?? 0)) / 4) * recency), 0, 5);
    return {
        score,
        reasons: score > 0 ? ['Phu hop nhu cau BDS dang duoc quan tam'] : [],
    };
}

function calculateAnchorBoost(
    property: MatchableProperty,
    anchors: NonNullable<HybridRankingContext['locationAnchors']>,
) {
    const locationText = [
        property.location?.district,
        property.location?.province,
        property.location?.rawAddress,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    if (!locationText) return { score: 0, reasons: [] as string[] };
    const match = anchors.find((anchor) =>
        [anchor.district, anchor.province, anchor.rawLocation]
            .filter(Boolean)
            .some((value) => locationText.includes(String(value).toLowerCase())),
    );
    return match
        ? { score: clamp(Number(match.baseWeight ?? 1) * 2, 0, 4), reasons: ['Gan dia diem BDS nguoi dung da khai bao'] }
        : { score: 0, reasons: [] };
}

function calculateFeatureBoost(
    property: MatchableProperty,
    signals: NonNullable<HybridRankingContext['canonicalSignals']>,
) {
    let score = 0;
    let totalWeight = 0;
    let matchedWeight = 0;
    const reasons = new Set<string>();

    for (const signal of signals) {
        const object = asObject(signal.value);
        const value = object.value;
        const weight = Math.max(0, Number(signal.effectiveWeight) || 0);
        totalWeight += weight;
        let matched = false;
        if (signal.signalType === PreferenceSignalType.BEDROOMS) matched = Number(value) === property.bedrooms;
        if (signal.signalType === PreferenceSignalType.BATHROOMS) matched = Number(value) === property.bathrooms;
        if (signal.signalType === PreferenceSignalType.FURNISHING) matched = equalText(value, property.furnishingStatus);
        if (signal.signalType === PreferenceSignalType.LEGAL_STATUS) matched = equalText(value, property.legalStatus);
        if (signal.signalType === PreferenceSignalType.DIRECTION) matched = equalText(value, property.direction);
        if (signal.signalType === PreferenceSignalType.AMENITY) {
            matched = (property.amenities ?? []).some((item) => equalText(value, item));
        }
        if (signal.signalType === PreferenceSignalType.NEARBY_PLACE) {
            matched = (property.nearbyPlaces ?? []).some(
                (item) => equalText(value, item.category) || equalText(value, item.name),
            );
        }
        if (matched) {
            matchedWeight += weight;
            score += Math.min(2, weight);
            reasons.add('Phu hop dac diem va tien ich BDS dang quan tam');
        }
    }
    return {
        score: clamp(Math.round(score), 0, 8),
        timeDecayWeight: totalWeight > 0 ? Number((matchedWeight / totalWeight).toFixed(4)) : 0,
        reasons: Array.from(reasons),
    };
}

function calculatePreferenceBoost(
    property: MatchableProperty,
    profile?: HybridRankingPreferenceProfile | null,
) {
    if (!profile) {
        return { score: 0, reasons: [] };
    }

    let boost = 0;
    const reasons: string[] = [];

    if (hasPositiveScore(profile.preferredTransactionTypes, property.transactionType)) {
        boost += 2;
        reasons.push('Phu hop loai giao dich BDS nguoi dung thuong quan tam');
    }
    if (hasPositiveScore(profile.preferredPropertyTypes, property.propertyType)) {
        boost += 3;
        reasons.push('Phu hop loai BDS nguoi dung thuong quan tam');
    }
    if (hasLocationPreference(profile.preferredLocations, property.location)) {
        boost += 3;
        reasons.push('Phu hop khu vuc BDS nguoi dung thuong quan tam');
    }
    if (isInRange(property.price, profile.preferredMinPrice, profile.preferredMaxPrice)) {
        boost += 1;
    }
    if (isInRange(property.area, profile.preferredMinArea, profile.preferredMaxArea)) {
        boost += 1;
    }

    return { score: clamp(boost, 0, 10), reasons };
}

function calculateFeedbackBoost(events: HybridRankingFeedbackEvent[]) {
    let boost = 0;
    const reasons = new Set<string>();

    for (const event of events) {
        if (event.eventType === UserBehaviorEventType.RECOMMENDATION_VIEW) {
            boost += 1;
        }
        if (event.eventType === UserBehaviorEventType.RECOMMENDATION_CLICK) {
            boost += 2;
            reasons.add('Nguoi dung da click goi y BDS tuong tu');
        }
        if (event.eventType === UserBehaviorEventType.RECOMMENDATION_SAVE) {
            boost += 4;
            reasons.add('Nguoi dung da luu goi y BDS tuong tu');
        }
        if (event.eventType === UserBehaviorEventType.RECOMMENDATION_CONTACT) {
            boost += 5;
            reasons.add('Nguoi dung da lien he goi y BDS tuong tu');
        }
        if (event.eventType === UserBehaviorEventType.RECOMMENDATION_DISMISS) {
            boost -= 8;
            reasons.add('Nguoi dung da bo qua goi y BDS tuong tu');
        }
    }

    return { score: clamp(boost, -10, 10), reasons: Array.from(reasons) };
}

function calculateFreshnessBoost(updatedAt: Date, now: Date) {
    const ageMs = now.getTime() - updatedAt.getTime();
    const ageDays = Math.floor(ageMs / 86_400_000);

    if (ageDays <= 30) {
        return {
            score: 2,
            reasons: ['Tin BDS moi cap nhat gan day'],
        };
    }
    if (ageDays <= 90) {
        return { score: 1, reasons: [] };
    }
    if (ageDays > 365) {
        return {
            score: -2,
            reasons: ['Tin BDS da cap nhat qua lau'],
        };
    }

    return { score: 0, reasons: [] };
}

function calculateStatusPenalty(previousStatus?: DemandMatchStatus | null) {
    if (previousStatus === DemandMatchStatus.DISMISSED) {
        return {
            score: -10,
            reasons: ['Nguoi dung da tung bo qua goi y BDS nay'],
        };
    }
    if (previousStatus === DemandMatchStatus.CONTACTED) {
        return {
            score: -8,
            reasons: ['Nguoi dung da tung lien he goi y BDS nay'],
        };
    }

    return { score: 0, reasons: [] };
}

function hasPositiveScore(mapValue: unknown, key: string) {
    if (!mapValue || typeof mapValue !== 'object' || Array.isArray(mapValue)) {
        return false;
    }

    const score = Number((mapValue as Record<string, unknown>)[key]);
    return Number.isFinite(score) && score > 0;
}

function hasLocationPreference(
    mapValue: unknown,
    location: MatchableProperty['location'],
) {
    if (!location || !mapValue || typeof mapValue !== 'object' || Array.isArray(mapValue)) {
        return false;
    }

    const candidates = [
        [location.district, location.province].filter(Boolean).join(', '),
        location.district,
        location.province,
        location.rawAddress,
    ]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());
    const locationScores = mapValue as Record<string, unknown>;

    return Object.entries(locationScores).some(([key, score]) => {
        const numericScore = Number(score);
        const normalizedKey = key.toLowerCase();

        return (
            Number.isFinite(numericScore) &&
            numericScore > 0 &&
            candidates.some(
                (candidate) =>
                    candidate.includes(normalizedKey) || normalizedKey.includes(candidate),
            )
        );
    });
}

function isInRange(value: number | null, minValue: unknown, maxValue: unknown) {
    if (value === null) {
        return false;
    }

    const min = Number(minValue);
    const max = Number(maxValue);
    const hasMin = Number.isFinite(min);
    const hasMax = Number.isFinite(max);

    if (!hasMin && !hasMax) {
        return false;
    }

    return (!hasMin || value >= min) && (!hasMax || value <= max);
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function equalText(left: unknown, right: unknown) {
    return typeof left === 'string' && typeof right === 'string' && left.toLowerCase() === right.toLowerCase();
}
