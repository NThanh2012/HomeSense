import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service.ts';
import {
    ExternalBehaviorAnalyzer,
    ExternalBehaviorAnalyzerInput,
    ExternalBehaviorAnalyzerOutput,
    ExternalBehaviorAnalyzerResult,
} from './external-behavior-analyzer.ts';
import { GeminiExternalBehaviorAnalyzer } from './gemini-external-behavior-analyzer.service.ts';

const PROMPT_VERSION = 'phase-18-cost-optimized-v1';

@Injectable()
export class CostOptimizedExternalBehaviorAnalyzer extends ExternalBehaviorAnalyzer {
    constructor(
        private readonly prisma: PrismaService,
        private readonly gemini: GeminiExternalBehaviorAnalyzer,
    ) {
        super();
    }

    async analyze(inputs: ExternalBehaviorAnalyzerInput[]): Promise<ExternalBehaviorAnalyzerResult> {
        const items: ExternalBehaviorAnalyzerOutput[] = [];
        const unresolved: ExternalBehaviorAnalyzerInput[] = [];
        let ruleBasedCount = 0;
        let cacheHitCount = 0;

        for (const input of inputs) {
            const ruleBased = this.extractRuleBased(input);
            if (ruleBased) {
                items.push(ruleBased);
                ruleBasedCount += 1;
                continue;
            }
            const cached = await this.findCached(input);
            if (cached) {
                items.push(cached);
                cacheHitCount += 1;
                continue;
            }
            unresolved.push(input);
        }

        const providerInputs = unresolved.filter((input) => input.providerAllowed !== false);
        const budgetBlocked = unresolved.filter((input) => input.providerAllowed === false);
        for (const input of budgetBlocked) {
            items.push({
                rawExternalBehaviorId: input.rawExternalBehaviorId,
                eventType: 'UNKNOWN',
                demandType: 'UNKNOWN',
                propertyTypes: ['UNKNOWN'],
                minPrice: null,
                maxPrice: null,
                minArea: null,
                maxArea: null,
                province: null,
                district: null,
                rawLocation: null,
                keywords: [],
                confidence: 0,
                reviewReason: 'Da dat gioi han Gemini theo user/ngay',
            });
        }

        let providerResult: ExternalBehaviorAnalyzerResult | null = null;
        if (providerInputs.length > 0) {
            providerResult = await this.gemini.analyze(providerInputs);
            for (const output of providerResult.items) {
                items.push(output);
                const input = providerInputs.find((candidate) => candidate.rawExternalBehaviorId === output.rawExternalBehaviorId);
                if (input) await this.saveCache(input, output, providerResult);
            }
        }

        const inputBytes = Buffer.byteLength(JSON.stringify(providerInputs), 'utf8');
        const outputBytes = Buffer.byteLength(JSON.stringify(providerResult?.items ?? []), 'utf8');
        return {
            provider: providerResult ? 'rule-cache-gemini' : 'rule-cache',
            model: providerResult?.model ?? 'rule-based',
            promptVersion: PROMPT_VERSION,
            items,
            estimatedInputTokens: Math.ceil(inputBytes / 4),
            estimatedOutputTokens: Math.ceil(outputBytes / 4),
            ruleBasedCount,
            cacheHitCount,
            providerRequestCount: providerInputs.length > 0 ? 1 : 0,
        };
    }

    private extractRuleBased(input: ExternalBehaviorAnalyzerInput): ExternalBehaviorAnalyzerOutput | null {
        const payload = input.payload;
        const text = this.firstText(payload, ['query', 'searchTerm', 'content', 'text', 'keyword']);
        const eventType = this.mapEventType(this.firstText(payload, ['eventType', 'action', 'type']), text);
        const demandType = this.mapDemandType(this.firstText(payload, ['demandType', 'transactionType']), text);
        const propertyTypes = this.mapPropertyTypes(payload.propertyType ?? payload.propertyTypes, text);
        const rawLocation = this.firstText(payload, ['rawLocation', 'location', 'address']);
        const province = this.firstText(payload, ['province', 'city']);
        const district = this.firstText(payload, ['district']);
        const keywords = [this.firstText(payload, ['keyword', 'query', 'searchTerm'])]
            .filter((value): value is string => Boolean(value))
            .slice(0, 10);
        const clearSignal =
            eventType !== 'UNKNOWN' &&
            (demandType !== 'UNKNOWN' ||
                propertyTypes.some((type) => type !== 'UNKNOWN') ||
                Boolean(rawLocation || province || district || keywords.length));
        if (!clearSignal) return null;

        return {
            rawExternalBehaviorId: input.rawExternalBehaviorId,
            eventType,
            demandType,
            propertyTypes,
            minPrice: this.numberOrNull(payload.minPrice),
            maxPrice: this.numberOrNull(payload.maxPrice ?? payload.budget),
            minArea: this.numberOrNull(payload.minArea),
            maxArea: this.numberOrNull(payload.maxArea),
            province,
            district,
            rawLocation,
            keywords,
            confidence: 0.85,
            reviewReason: null,
        };
    }

    private async findCached(input: ExternalBehaviorAnalyzerInput) {
        const cache = await this.prisma.llmExtractionCache.findUnique({
            where: { cacheKey: this.cacheKey(input) },
        });
        return cache?.result as unknown as ExternalBehaviorAnalyzerOutput | null;
    }

    private async saveCache(
        input: ExternalBehaviorAnalyzerInput,
        output: ExternalBehaviorAnalyzerOutput,
        result: ExternalBehaviorAnalyzerResult,
    ) {
        const inputTokens = Math.ceil(Buffer.byteLength(JSON.stringify(input.payload), 'utf8') / 4);
        const outputTokens = Math.ceil(Buffer.byteLength(JSON.stringify(output), 'utf8') / 4);
        await this.prisma.llmExtractionCache.upsert({
            where: { cacheKey: this.cacheKey(input) },
            create: {
                cacheKey: this.cacheKey(input),
                provider: result.provider,
                model: result.model,
                promptVersion: result.promptVersion,
                result: output as unknown as Prisma.InputJsonValue,
                estimatedInputTokens: inputTokens,
                estimatedOutputTokens: outputTokens,
            },
            update: {
                result: output as unknown as Prisma.InputJsonValue,
                estimatedInputTokens: inputTokens,
                estimatedOutputTokens: outputTokens,
            },
        });
    }

    private cacheKey(input: ExternalBehaviorAnalyzerInput) {
        return createHash('sha256')
            .update(`${PROMPT_VERSION}:${process.env.GEMINI_MODEL ?? 'default'}:${this.stableStringify(input.payload)}`)
            .digest('hex');
    }

    private mapEventType(value: string | null, text: string | null): ExternalBehaviorAnalyzerOutput['eventType'] {
        const normalized = `${value ?? ''} ${text ?? ''}`.toLowerCase();
        if (/save|favorite|luu/.test(normalized)) return 'SAVE';
        if (/contact|inquiry|lien he/.test(normalized)) return 'CONTACT';
        if (/search|tim|query/.test(normalized)) return 'SEARCH';
        if (/view|xem/.test(normalized)) return 'VIEW';
        return 'UNKNOWN';
    }

    private mapDemandType(value: string | null, text: string | null): ExternalBehaviorAnalyzerOutput['demandType'] {
        const normalized = `${value ?? ''} ${text ?? ''}`.toLowerCase();
        if (/rent|thue/.test(normalized)) return 'RENT';
        if (/buy|sell|mua|ban/.test(normalized)) return 'BUY';
        return 'UNKNOWN';
    }

    private mapPropertyTypes(value: unknown, text: string | null): ExternalBehaviorAnalyzerOutput['propertyTypes'] {
        const normalized = `${Array.isArray(value) ? value.join(' ') : value ?? ''} ${text ?? ''}`.toLowerCase();
        const types: ExternalBehaviorAnalyzerOutput['propertyTypes'] = [];
        if (/apartment|can ho|chung cu/.test(normalized)) types.push('APARTMENT');
        if (/villa|biet thu/.test(normalized)) types.push('VILLA');
        if (/room|phong tro/.test(normalized)) types.push('ROOM');
        if (/land|dat/.test(normalized)) types.push('LAND');
        if (/house|nha/.test(normalized)) types.push('HOUSE');
        return types.length > 0 ? types : ['UNKNOWN'];
    }

    private firstText(payload: Record<string, unknown>, keys: string[]) {
        for (const key of keys) {
            const value = payload[key];
            if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 500);
        }
        return null;
    }

    private numberOrNull(value: unknown) {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : null;
    }

    private stableStringify(value: unknown): string {
        if (Array.isArray(value)) return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
        if (value && typeof value === 'object') {
            return `{${Object.entries(value as Record<string, unknown>)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, item]) => `${JSON.stringify(key)}:${this.stableStringify(item)}`)
                .join(',')}}`;
        }
        return JSON.stringify(value);
    }
}
