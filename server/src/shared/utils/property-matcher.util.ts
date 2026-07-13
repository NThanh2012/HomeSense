import { DemandType, PropertyStatus, PropertyType, TransactionType } from '@prisma/client';

export interface MatchableDemand {
    demandType: DemandType;
    propertyTypes: PropertyType[];
    minPrice: number | null;
    maxPrice: number | null;
    minArea: number | null;
    maxArea: number | null;
    province: string | null;
    district: string | null;
    rawLocation: string | null;
    keywords: string[];
}

export interface MatchableProperty {
    id: string;
    status: PropertyStatus;
    transactionType: TransactionType;
    propertyType: PropertyType;
    price: number | null;
    area: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    furnishingStatus?: string | null;
    legalStatus?: string | null;
    direction?: string | null;
    amenities?: string[];
    nearbyPlaces?: Array<{ category: string; name: string; distanceKm?: number | null }>;
    title: string;
    description: string | null;
    location: {
        province: string | null;
        district: string | null;
        rawAddress: string | null;
    } | null;
    updatedAt: Date;
}

export interface ScoreBreakdown {
    transactionType: number;
    propertyType: number;
    price: number;
    area: number;
    location: number;
    keyword: number;
}

export interface MatchResult {
    propertyId: string;
    matchScore: number;
    matchReasons: string[];
    scoreBreakdown: ScoreBreakdown;
}

/** Property không đủ điều kiện tối thiểu để được match */
export interface SkippedProperty {
    propertyId: string;
    reason: string;
}

export interface MatchOutput {
    matches: MatchResult[];
    skipped: SkippedProperty[];
}

const SCORE_MIN_THRESHOLD = 10;
const MAX_MATCHES = 50;
const PRICE_TOLERANCE = 0.15;   // ±15%
const AREA_TOLERANCE = 0.20;    // ±20%

/**
 * Ghép nhu cầu BĐS với danh sách bất động sản phù hợp.
 * Thuật toán rule-based, không dùng AI/ML.
 */
export function matchDemandToProperties(
    demand: MatchableDemand,
    properties: MatchableProperty[],
): MatchOutput {
    const matches: MatchResult[] = [];
    const skipped: SkippedProperty[] = [];

    for (const property of properties) {
        // Loại ngay nếu không PUBLISHED
        if (property.status !== PropertyStatus.PUBLISHED) {
            skipped.push({ propertyId: property.id, reason: 'Bất động sản không ở trạng thái công bố' });
            continue;
        }

        const breakdown: ScoreBreakdown = {
            transactionType: 0,
            propertyType: 0,
            price: 0,
            area: 0,
            location: 0,
            keyword: 0,
        };
        const reasons: string[] = [];

        // ── 1. Transaction Type (0–25) ───────────────────────────────
        const txScore = scoreTransactionType(demand.demandType, property.transactionType);
        if (txScore === null) {
            skipped.push({ propertyId: property.id, reason: 'Loại giao dịch không khớp' });
            continue;
        }
        breakdown.transactionType = txScore.score;
        if (txScore.reason) reasons.push(txScore.reason);

        // ── 2. Property Type (0–20) ──────────────────────────────────
        const ptScore = scorePropertyType(demand.propertyTypes, property.propertyType);
        breakdown.propertyType = ptScore.score;
        if (ptScore.reason) reasons.push(ptScore.reason);

        // ── 3. Price (0–20) ──────────────────────────────────────────
        const priceScore = scorePriceRange(demand.minPrice, demand.maxPrice, property.price);
        breakdown.price = priceScore.score;
        if (priceScore.reason) reasons.push(priceScore.reason);

        // ── 4. Area (0–10) ───────────────────────────────────────────
        const areaScore = scoreAreaRange(demand.minArea, demand.maxArea, property.area);
        breakdown.area = areaScore.score;
        if (areaScore.reason) reasons.push(areaScore.reason);

        // ── 5. Location (0–20) ───────────────────────────────────────
        const locScore = scoreLocation(demand, property);
        breakdown.location = locScore.score;
        if (locScore.reason) reasons.push(locScore.reason);

        // ── 6. Keyword overlap (0–5) ─────────────────────────────────
        const kwScore = scoreKeywords(demand.keywords, property);
        breakdown.keyword = kwScore.score;
        if (kwScore.reason) reasons.push(kwScore.reason);

        const total = breakdown.transactionType + breakdown.propertyType + breakdown.price +
                      breakdown.area + breakdown.location + breakdown.keyword;

        if (total < SCORE_MIN_THRESHOLD) {
            skipped.push({ propertyId: property.id, reason: `Điểm tổng quá thấp (${total})` });
            continue;
        }

        matches.push({
            propertyId: property.id,
            matchScore: total,
            matchReasons: reasons,
            scoreBreakdown: breakdown,
        });
    }

    // Sắp xếp theo score giảm dần, lấy top MAX_MATCHES
    matches.sort((a, b) => b.matchScore - a.matchScore);
    return {
        matches: matches.slice(0, MAX_MATCHES),
        skipped,
    };
}

// ── Scoring helpers ──────────────────────────────────────────────────────────

function scoreTransactionType(
    demandType: DemandType,
    txType: TransactionType,
): { score: number; reason: string | null } | null {
    if (demandType === DemandType.BUY && txType === TransactionType.SELL) {
        return { score: 25, reason: 'Cùng loại giao dịch: Mua bán' };
    }
    if (demandType === DemandType.RENT && txType === TransactionType.RENT) {
        return { score: 25, reason: 'Cùng loại giao dịch: Cho thuê' };
    }
    // BUY vs RENT hoặc RENT vs SELL → loại
    if (
        (demandType === DemandType.BUY && txType === TransactionType.RENT) ||
        (demandType === DemandType.RENT && txType === TransactionType.SELL)
    ) {
        return null;
    }
    // UNKNOWN hoặc SELL demand → cho điểm tối thiểu, không loại
    return { score: 5, reason: null };
}

function scorePropertyType(
    demandTypes: PropertyType[],
    propertyType: PropertyType,
): { score: number; reason: string | null } {
    if (demandTypes.length === 0) {
        return { score: 5, reason: null };
    }
    if (propertyType === PropertyType.UNKNOWN) {
        return { score: 5, reason: null };
    }
    if (demandTypes.includes(propertyType)) {
        return { score: 20, reason: `Đúng loại bất động sản: ${formatPropertyType(propertyType)}` };
    }
    return { score: 0, reason: null };
}

function scorePriceRange(
    minPrice: number | null,
    maxPrice: number | null,
    price: number | null,
): { score: number; reason: string | null } {
    if (price === null) {
        return { score: 3, reason: null };
    }
    if (minPrice === null && maxPrice === null) {
        return { score: 3, reason: null };
    }

    const aboveMin = minPrice === null || price >= minPrice;
    const belowMax = maxPrice === null || price <= maxPrice;

    if (aboveMin && belowMax) {
        return { score: 20, reason: `Giá nằm trong ngân sách (${formatPriceShort(price)})` };
    }

    // Kiểm tra lệch nhẹ
    if (maxPrice !== null && price > maxPrice) {
        const diff = (price - maxPrice) / maxPrice;
        if (diff <= PRICE_TOLERANCE) {
            return { score: 10, reason: `Giá gần ngân sách (${formatPriceShort(price)})` };
        }
    }
    if (minPrice !== null && price < minPrice) {
        const diff = (minPrice - price) / minPrice;
        if (diff <= PRICE_TOLERANCE) {
            return { score: 10, reason: `Giá gần ngân sách (${formatPriceShort(price)})` };
        }
    }

    return { score: 0, reason: null };
}

function scoreAreaRange(
    minArea: number | null,
    maxArea: number | null,
    area: number | null,
): { score: number; reason: string | null } {
    if (area === null) {
        return { score: 2, reason: null };
    }
    if (minArea === null && maxArea === null) {
        return { score: 2, reason: null };
    }

    const aboveMin = minArea === null || area >= minArea;
    const belowMax = maxArea === null || area <= maxArea;

    if (aboveMin && belowMax) {
        return { score: 10, reason: `Diện tích phù hợp (${area} m²)` };
    }

    // Kiểm tra lệch nhẹ
    if (maxArea !== null && area > maxArea) {
        const diff = (area - maxArea) / maxArea;
        if (diff <= AREA_TOLERANCE) {
            return { score: 5, reason: `Diện tích gần phù hợp (${area} m²)` };
        }
    }
    if (minArea !== null && area < minArea) {
        const diff = (minArea - area) / minArea;
        if (diff <= AREA_TOLERANCE) {
            return { score: 5, reason: `Diện tích gần phù hợp (${area} m²)` };
        }
    }

    return { score: 0, reason: null };
}

function scoreLocation(
    demand: Pick<MatchableDemand, 'province' | 'district' | 'rawLocation'>,
    property: Pick<MatchableProperty, 'location'>,
): { score: number; reason: string | null } {
    const loc = property.location;
    if (!loc) return { score: 0, reason: null };

    // District match (case-insensitive)
    if (demand.district && loc.district) {
        if (normalizeStr(loc.district).includes(normalizeStr(demand.district)) ||
            normalizeStr(demand.district).includes(normalizeStr(loc.district))) {
            return { score: 20, reason: `Cùng quận/huyện: ${loc.district}` };
        }
    }

    // Province match
    if (demand.province && loc.province) {
        if (normalizeStr(loc.province).includes(normalizeStr(demand.province)) ||
            normalizeStr(demand.province).includes(normalizeStr(loc.province))) {
            return { score: 10, reason: `Cùng tỉnh/thành: ${loc.province}` };
        }
    }

    // rawLocation keyword in address
    if (demand.rawLocation && loc.rawAddress) {
        const rawTokens = demand.rawLocation.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const addrLower = loc.rawAddress.toLowerCase();
        const overlap = rawTokens.filter(t => addrLower.includes(t));
        if (overlap.length > 0) {
            return { score: 5, reason: `Vị trí gần khu vực mong muốn` };
        }
    }

    return { score: 0, reason: null };
}

function scoreKeywords(
    keywords: string[],
    property: Pick<MatchableProperty, 'title' | 'description'>,
): { score: number; reason: string | null } {
    if (keywords.length === 0) return { score: 0, reason: null };

    const haystack = `${property.title} ${property.description ?? ''}`.toLowerCase();
    let hits = 0;

    for (const kw of keywords) {
        if (haystack.includes(kw.toLowerCase())) {
            hits++;
        }
    }

    const score = Math.min(hits, 5);
    if (score > 0) {
        return { score, reason: `Nội dung khớp từ khóa tìm kiếm` };
    }
    return { score: 0, reason: null };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStr(s: string): string {
    return s.toLowerCase().trim();
}

function formatPriceShort(price: number): string {
    if (price >= 1_000_000_000) {
        return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
    }
    if (price >= 1_000_000) {
        return `${(price / 1_000_000).toFixed(0)} triệu`;
    }
    return `${price.toLocaleString('vi-VN')} đ`;
}

function formatPropertyType(pt: PropertyType): string {
    const map: Record<PropertyType, string> = {
        APARTMENT: 'Căn hộ',
        HOUSE: 'Nhà ở',
        LAND: 'Đất nền',
        VILLA: 'Biệt thự',
        ROOM: 'Phòng trọ',
        UNKNOWN: 'Không xác định',
    };
    return map[pt] ?? pt;
}
