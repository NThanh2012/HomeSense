import { RawPostStatus } from '../schemas/raw-post.schema.ts';

export class RawPostEntity {
    id: string;
    sourceType: string;
    sourceName: string;
    content: string;
    status: RawPostStatus;
}
