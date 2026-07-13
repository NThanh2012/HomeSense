import { PropertyType, TransactionType } from '@prisma/client';
import { parseVietnamesePhone } from './phone-mask.util.ts';
import { parseVietnamesePrice } from './price-parser.util.ts';
import {
    getFirstContentLine,
    normalizeSpaces,
    normalizeVietnameseText,
} from './text-normalizer.util.ts';

export interface ParsedPropertyText {
    title: string;
    rawAddress: string | null;
    price: number | null;
    area: number | null;
    phone: string | null;
    transactionType: TransactionType;
    propertyType: PropertyType;
    bedrooms: number | null;
    bathrooms: number | null;
    furnishingStatus: string | null;
    legalStatus: string | null;
    direction: string | null;
    amenities: string[];
    confidence: number;
}

export const parsePropertyText = (content: string): ParsedPropertyText => {
    const normalized = normalizeVietnameseText(content);
    const title = getFirstContentLine(content).slice(0, 180);
    const rawAddress = parseAddress(content);
    const price = parseVietnamesePrice(content);
    const area = parseArea(normalized);
    const phone = parseVietnamesePhone(content);
    const transactionType = parseTransactionType(normalized);
    const propertyType = parsePropertyType(normalized);
    const bedrooms = parseCount(normalized, /\b(\d+)\s*(phong ngu|pn|bedroom)/);
    const bathrooms = parseCount(normalized, /\b(\d+)\s*(phong tam|wc|toilet|bathroom)/);
    const furnishingStatus = parseFurnishing(normalized);
    const legalStatus = parseLegalStatus(normalized);
    const direction = parseDirection(normalized);
    const amenities = parseAmenities(normalized);

    const matchedFields = [
        price,
        area,
        phone,
        rawAddress,
        transactionType !== TransactionType.UNKNOWN,
        propertyType !== PropertyType.UNKNOWN,
        bedrooms,
        bathrooms,
        furnishingStatus,
        legalStatus,
        direction,
        amenities.length > 0,
    ].filter(Boolean).length;

    return {
        title: title || 'Tin bất động sản',
        rawAddress: rawAddress,
        price: price,
        area: area,
        phone: phone,
        transactionType: transactionType,
        propertyType: propertyType,
        bedrooms,
        bathrooms,
        furnishingStatus,
        legalStatus,
        direction,
        amenities,
        confidence: Number((matchedFields / 12).toFixed(2)),
    };
};

const parseCount = (content: string, pattern: RegExp): number | null => {
    const match = content.match(pattern);
    return match ? Number(match[1]) : null;
};

const parseFurnishing = (content: string): string | null => {
    if (/\b(full noi that|day du noi that|noi that day du)\b/.test(content)) return 'FULL';
    if (/\b(co ban|noi that co ban)\b/.test(content)) return 'BASIC';
    if (/\b(khong noi that|nha trong)\b/.test(content)) return 'NONE';
    return null;
};

const parseLegalStatus = (content: string): string | null => {
    if (/\b(so hong|so do|phap ly day du)\b/.test(content)) return 'CERTIFICATE';
    if (/\b(hop dong mua ban)\b/.test(content)) return 'SALE_CONTRACT';
    return null;
};

const parseDirection = (content: string): string | null => {
    const match = content.match(/\bhuong\s+(dong nam|dong bac|tay nam|tay bac|dong|tay|nam|bac)\b/);
    return match ? match[1].toUpperCase().replace(/\s+/g, '_') : null;
};

const parseAmenities = (content: string): string[] => {
    const dictionary: Array<[RegExp, string]> = [
        [/\bho boi\b/, 'POOL'],
        [/\bphong gym\b|\bgym\b/, 'GYM'],
        [/\bbao ve\b|\ban ninh\b/, 'SECURITY'],
        [/\bcho dau xe\b|\bbai do xe\b/, 'PARKING'],
        [/\bthang may\b/, 'ELEVATOR'],
        [/\bban cong\b/, 'BALCONY'],
        [/\bcong vien\b/, 'PARK'],
        [/\btruong hoc\b/, 'SCHOOL'],
    ];
    return dictionary.filter(([pattern]) => pattern.test(content)).map(([, value]) => value);
};

const parseArea = (normalizedContent: string): number | null => {
    const areaMatch = normalizedContent.match(/(\d+(?:[.,]\d+)?)\s*(m2|m²|m vuong|met vuong)/u);
    if (!areaMatch) {
        return null;
    }

    return Number(areaMatch[1].replace(',', '.'));
};

const parseAddress = (content: string): string | null => {
    const explicitAddress = content.match(/(?:địa chỉ|dia chi|đ\/c|dc)\s*[:\-]\s*(.+)/i);
    if (explicitAddress) {
        return normalizeSpaces(explicitAddress[1]).slice(0, 255);
    }

    const addressLine = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => {
            const normalizedLine = normalizeVietnameseText(line);
            return /(quan|huyen|phuong|xa|duong|tp|thanh pho|tinh)\b/.test(normalizedLine);
        });

    return addressLine ? normalizeSpaces(addressLine).slice(0, 255) : null;
};

const parseTransactionType = (normalizedContent: string): TransactionType => {
    if (/\b(cho thue|can thue|thue)\b/.test(normalizedContent)) {
        return TransactionType.RENT;
    }

    if (/\b(ban|can ban|sang nhuong)\b/.test(normalizedContent)) {
        return TransactionType.SELL;
    }

    return TransactionType.UNKNOWN;
};

const parsePropertyType = (normalizedContent: string): PropertyType => {
    if (/\b(chung cu|can ho|apartment)\b/.test(normalizedContent)) {
        return PropertyType.APARTMENT;
    }

    if (/\b(biet thu|villa)\b/.test(normalizedContent)) {
        return PropertyType.VILLA;
    }

    if (/\b(phong tro|nha tro)\b/.test(normalizedContent)) {
        return PropertyType.ROOM;
    }

    if (/\b(dat|dat nen|lo dat)\b/.test(normalizedContent)) {
        return PropertyType.LAND;
    }

    if (/\b(nha|nha pho)\b/.test(normalizedContent)) {
        return PropertyType.HOUSE;
    }

    return PropertyType.UNKNOWN;
};
