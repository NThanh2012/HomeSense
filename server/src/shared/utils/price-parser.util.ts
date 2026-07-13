import { normalizeVietnameseText } from './text-normalizer.util.ts';

export const parseVietnamesePrice = (content: string): number | null => {
    const normalized = normalizeVietnameseText(content).replace(/,/g, '.');

    const billionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(ty|ti)\b/);
    if (billionMatch) {
        return Math.round(Number(billionMatch[1]) * 1_000_000_000);
    }

    const millionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(trieu|tr)\b/);
    if (millionMatch) {
        return Math.round(Number(millionMatch[1]) * 1_000_000);
    }

    return null;
};
