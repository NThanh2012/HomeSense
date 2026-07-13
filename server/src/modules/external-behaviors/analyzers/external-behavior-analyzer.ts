export type ExternalBehaviorSignalType = 'VIEW' | 'SAVE' | 'SEARCH' | 'CONTACT' | 'UNKNOWN';
export type ExternalBehaviorDemandType = 'BUY' | 'RENT' | 'UNKNOWN';
export type ExternalBehaviorPropertyType =
    | 'APARTMENT'
    | 'HOUSE'
    | 'LAND'
    | 'VILLA'
    | 'ROOM'
    | 'UNKNOWN';

export interface ExternalBehaviorAnalyzerInput {
    rawExternalBehaviorId: string;
    occurredAt: string | null;
    payload: Record<string, unknown>;
    providerAllowed?: boolean;
}

export interface ExternalBehaviorAnalyzerOutput {
    rawExternalBehaviorId: string;
    eventType: ExternalBehaviorSignalType;
    demandType: ExternalBehaviorDemandType;
    propertyTypes: ExternalBehaviorPropertyType[];
    minPrice: number | null;
    maxPrice: number | null;
    minArea: number | null;
    maxArea: number | null;
    province: string | null;
    district: string | null;
    rawLocation: string | null;
    keywords: string[];
    confidence: number;
    reviewReason: string | null;
}

export interface ExternalBehaviorAnalyzerResult {
    provider: string;
    model: string;
    promptVersion: string;
    items: ExternalBehaviorAnalyzerOutput[];
    estimatedInputTokens?: number;
    estimatedOutputTokens?: number;
    ruleBasedCount?: number;
    cacheHitCount?: number;
    providerRequestCount?: number;
}

export abstract class ExternalBehaviorAnalyzer {
    abstract analyze(inputs: ExternalBehaviorAnalyzerInput[]): Promise<ExternalBehaviorAnalyzerResult>;
}
