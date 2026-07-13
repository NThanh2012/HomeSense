import type { MetadataRoute } from 'next';
import { getProperties } from '../features/properties/properties.api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    try {
        const result = await getProperties({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }, { next: { revalidate: 3600 } });
        return result.items.map((property) => ({
            url: `${baseUrl}/properties/${property.id}`,
            lastModified: new Date(property.updatedAt),
            changeFrequency: 'daily',
            priority: 0.8,
        }));
    } catch {
        return [{ url: `${baseUrl}/properties`, changeFrequency: 'daily', priority: 0.7 }];
    }
}
