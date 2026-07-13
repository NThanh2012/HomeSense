import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { PropertyDetail } from '../../../components/properties/PropertyDetail';
import { getPropertyById } from '../../../features/properties/properties.api';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const property = await getPropertyById(id, { cache: 'no-store' });
        const description = (property.description ?? `${property.propertyType} ${property.transactionType}`).slice(0, 160);
        return {
            title: `${property.title} | HomeSense`,
            description,
            alternates: { canonical: `/properties/${property.id}` },
            robots: property.status === 'PUBLISHED' ? { index: true, follow: true } : { index: false, follow: false },
        };
    } catch {
        return { title: 'Bất động sản | HomeSense', robots: { index: false, follow: false } };
    }
}

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Không thể tải chi tiết bất động sản.';
};

async function PropertyDetailResult({ id }: { id: string }) {
    try {
        const property = await getPropertyById(id, {
            cache: 'no-store',
        });

        if (!property) {
            return (
                <EmptyState
                    title="Không tìm thấy bất động sản"
                    description="Tin này có thể đã bị xóa hoặc chưa được phân tích."
                    actionHref="/properties"
                    actionLabel="Về danh sách"
                />
            );
        }

        const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: property.title,
            description: property.description,
            url: `/properties/${property.id}`,
            floorSize: property.area ? { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK' } : undefined,
            address: property.location?.rawAddress,
            offers: property.price ? { '@type': 'Offer', price: property.price, priceCurrency: 'VND' } : undefined,
        };
        return (
            <>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
                <PropertyDetail property={property} />
            </>
        );
    } catch (error) {
        return (
            <ErrorState
                title="Không thể tải chi tiết"
                message={getErrorMessage(error)}
                actionHref="/properties"
                actionLabel="Về danh sách"
            />
        );
    }
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <main className="page-shell">
            <div className="back-row">
                <Link href="/properties" className="text-link">
                    Về danh sách
                </Link>
            </div>

            <Suspense fallback={<Loading label="Đang tải chi tiết bất động sản..." />}>
                <PropertyDetailResult id={id} />
            </Suspense>
        </main>
    );
}
