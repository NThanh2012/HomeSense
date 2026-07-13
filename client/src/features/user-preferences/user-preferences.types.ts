export interface UserPreferenceProfile {
    id: string | null;
    userId: string;
    preferredTransactionTypes: Record<string, number>;
    preferredPropertyTypes: Record<string, number>;
    preferredLocations: Record<string, number>;
    keywords: Record<string, number>;
    preferredMinPrice: number | null;
    preferredMaxPrice: number | null;
    preferredMinArea: number | null;
    preferredMaxArea: number | null;
    lastComputedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}
