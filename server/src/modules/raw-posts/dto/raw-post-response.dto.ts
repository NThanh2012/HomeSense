import { RawPostStatus } from '../schemas/raw-post.schema.ts';

export class RawPostResponseDto {
    id: string;
    sourceType: string;
    sourceName: string;
    sourceUrl?: string;
    externalId?: string;
    content: string;
    authorName?: string;
    authorPhone?: string;
    mediaUrls: string[];
    status: RawPostStatus;
    capturedAt: string;
    createdAt?: string;
    updatedAt?: string;
    metadata?: Record<string, unknown>;
}
