import { DemandType, PropertyType } from '@prisma/client';

export interface ParsedUserDemand {
    demandType: DemandType;
    propertyTypes: PropertyType[];
    minPrice: number | null;
    maxPrice: number | null;
    minArea: number | null;
    maxArea: number | null;
    rawLocation: string | null;
    province: string | null;
    district: string | null;
    ward: string | null;
    keywords: string[];
    phone: string | null;
    confidence: number;
}

const normalizeText = (text: string) =>
    text
        .toLowerCase()
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .trim();

const parseNumber = (value: string) => Number(value.replace(',', '.'));

const toPriceValue = (value: number, unit: string) => {
    const normalizedUnit = normalizeText(unit);

    if (normalizedUnit.includes('tỷ') || normalizedUnit.includes('ty')) {
        return value * 1_000_000_000;
    }

    if (normalizedUnit.includes('triệu') || normalizedUnit.includes('trieu')) {
        return value * 1_000_000;
    }

    return value;
};

const unique = <T>(items: T[]) => Array.from(new Set(items));

const findDemandType = (text: string): DemandType => {
    if (/(cần mua|can mua|tìm mua|tim mua|muốn mua|muon mua|mua nhà|mua nha|mua đất|mua dat)/.test(text)) {
        return DemandType.BUY;
    }

    if (/(cần thuê|can thue|tìm thuê|tim thue|thuê căn hộ|thue can ho|thuê phòng|thue phong|thuê nhà|thue nha)/.test(text)) {
        return DemandType.RENT;
    }

    if (/(cần bán|can ban|bán nhà|ban nha|bán đất|ban dat|chính chủ bán|chinh chu ban)/.test(text)) {
        return DemandType.SELL;
    }

    return DemandType.UNKNOWN;
};

const findPropertyTypes = (text: string): PropertyType[] => {
    const result: PropertyType[] = [];

    if (/(căn hộ|can ho|chung cư|chung cu)/.test(text)) {
        result.push(PropertyType.APARTMENT);
    }

    if (/(nhà|nha|nhà phố|nha pho)/.test(text)) {
        result.push(PropertyType.HOUSE);
    }

    if (/(đất nền|dat nen|đất|dat)/.test(text)) {
        result.push(PropertyType.LAND);
    }

    if (/(biệt thự|biet thu)/.test(text)) {
        result.push(PropertyType.VILLA);
    }

    if (/(phòng trọ|phong tro|thuê phòng|thue phong)/.test(text)) {
        result.push(PropertyType.ROOM);
    }

    return unique(result);
};

const findKeywords = (text: string): string[] => {
    const keywords: string[] = [];

    if (/(mặt bằng|mat bang)/.test(text)) {
        keywords.push('mặt bằng');
    }

    if (/shophouse/.test(text)) {
        keywords.push('shophouse');
    }

    if (/(gần trường|gan truong)/.test(text)) {
        keywords.push('gần trường');
    }

    if (/(khu công nghiệp|khu cong nghiep)/.test(text)) {
        keywords.push('gần khu công nghiệp');
    }

    return unique(keywords);
};

const findPriceRange = (text: string) => {
    const rangeMatch = text.match(/(\d+(?:[,.]\d+)?)\s*[-–]\s*(\d+(?:[,.]\d+)?)\s*(tỷ|ty|triệu|trieu)/);

    if (rangeMatch) {
        return {
            minPrice: toPriceValue(parseNumber(rangeMatch[1]), rangeMatch[3]),
            maxPrice: toPriceValue(parseNumber(rangeMatch[2]), rangeMatch[3]),
        };
    }

    const belowMatch = text.match(/(?:dưới|duoi|tối đa|toi da|max)\s*(\d+(?:[,.]\d+)?)\s*(tỷ|ty|triệu|trieu)/);

    if (belowMatch) {
        return {
            minPrice: null,
            maxPrice: toPriceValue(parseNumber(belowMatch[1]), belowMatch[2]),
        };
    }

    const aboveMatch = text.match(/(?:trên|tren|từ|tu)\s*(\d+(?:[,.]\d+)?)\s*(tỷ|ty|triệu|trieu)/);

    if (aboveMatch) {
        return {
            minPrice: toPriceValue(parseNumber(aboveMatch[1]), aboveMatch[2]),
            maxPrice: null,
        };
    }

    const singleMatch = text.match(/(?:khoảng|khoang|tầm|tam|ngân sách|ngan sach|giá|gia)?\s*(\d+(?:[,.]\d+)?)\s*(tỷ|ty|triệu|trieu)/);

    if (singleMatch) {
        const price = toPriceValue(parseNumber(singleMatch[1]), singleMatch[2]);

        return {
            minPrice: price,
            maxPrice: price,
        };
    }

    return {
        minPrice: null,
        maxPrice: null,
    };
};

const findAreaRange = (text: string) => {
    const rangeMatch = text.match(/(\d+(?:[,.]\d+)?)\s*[-–]\s*(\d+(?:[,.]\d+)?)\s*m(?:2|²)/);

    if (rangeMatch) {
        return {
            minArea: parseNumber(rangeMatch[1]),
            maxArea: parseNumber(rangeMatch[2]),
        };
    }

    const aboveMatch = text.match(/(?:trên|tren|từ|tu)\s*(\d+(?:[,.]\d+)?)\s*m(?:2|²)/);

    if (aboveMatch) {
        return {
            minArea: parseNumber(aboveMatch[1]),
            maxArea: null,
        };
    }

    const belowMatch = text.match(/(?:dưới|duoi|tối đa|toi da|max)\s*(\d+(?:[,.]\d+)?)\s*m(?:2|²)/);

    if (belowMatch) {
        return {
            minArea: null,
            maxArea: parseNumber(belowMatch[1]),
        };
    }

    const singleMatch = text.match(/(\d+(?:[,.]\d+)?)\s*m(?:2|²)/);

    if (singleMatch) {
        const area = parseNumber(singleMatch[1]);

        return {
            minArea: area,
            maxArea: area,
        };
    }

    return {
        minArea: null,
        maxArea: null,
    };
};

const findPhone = (text: string) => {
    const match = text.match(/(?:\+84|0)(?:[\s.-]?\d){8,10}/);

    if (!match) {
        return null;
    }

    const digits = match[0].replace(/\D/g, '');

    if (digits.startsWith('84')) {
        return `0${digits.slice(2)}`;
    }

    return digits;
};

const findLocation = (text: string) => {
    const knownLocations = [
        { pattern: /cầu giấy|cau giay/, province: 'Hà Nội', district: 'Cầu Giấy', rawLocation: 'Cầu Giấy' },
        { pattern: /hà nội|ha noi/, province: 'Hà Nội', district: null, rawLocation: 'Hà Nội' },
        { pattern: /đà nẵng|da nang/, province: 'Đà Nẵng', district: null, rawLocation: 'Đà Nẵng' },
        { pattern: /quận 7|quan 7/, province: 'TP. Hồ Chí Minh', district: 'Quận 7', rawLocation: 'Quận 7' },
        { pattern: /bách khoa|bach khoa/, province: 'Hà Nội', district: 'Hai Bà Trưng', rawLocation: 'Bách Khoa' },
    ];

    const found = knownLocations.find((item) => item.pattern.test(text));

    if (!found) {
        return {
            rawLocation: null,
            province: null,
            district: null,
            ward: null,
        };
    }

    return {
        rawLocation: found.rawLocation,
        province: found.province,
        district: found.district,
        ward: null,
    };
};

const scoreConfidence = (parsed: Omit<ParsedUserDemand, 'confidence'>) => {
    let score = 0;

    if (parsed.demandType !== DemandType.UNKNOWN) {
        score += 0.2;
    }

    if (parsed.propertyTypes.length > 0) {
        score += 0.2;
    }

    if (parsed.rawLocation || parsed.province || parsed.district) {
        score += 0.2;
    }

    if (parsed.minPrice !== null || parsed.maxPrice !== null) {
        score += 0.2;
    }

    if (parsed.minArea !== null || parsed.maxArea !== null) {
        score += 0.1;
    }

    if (parsed.phone) {
        score += 0.1;
    }

    return Math.min(1, Number(score.toFixed(2)));
};

export const parseUserDemandText = (content: string): ParsedUserDemand => {
    const text = normalizeText(content);
    const priceRange = findPriceRange(text);
    const areaRange = findAreaRange(text);
    const location = findLocation(text);
    const parsedWithoutConfidence = {
        demandType: findDemandType(text),
        propertyTypes: findPropertyTypes(text),
        minPrice: priceRange.minPrice,
        maxPrice: priceRange.maxPrice,
        minArea: areaRange.minArea,
        maxArea: areaRange.maxArea,
        rawLocation: location.rawLocation,
        province: location.province,
        district: location.district,
        ward: location.ward,
        keywords: findKeywords(text),
        phone: findPhone(text),
    };

    return {
        ...parsedWithoutConfidence,
        confidence: scoreConfidence(parsedWithoutConfidence),
    };
};
