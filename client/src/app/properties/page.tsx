import { Suspense } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Loading } from '../../components/common/Loading';
import { PropertyActiveFilters } from '../../components/properties/PropertyActiveFilters';
import { PropertyFilter } from '../../components/properties/PropertyFilter';
import { PropertyList } from '../../components/properties/PropertyList';
import { PropertySearchBehaviorTracker } from '../../components/properties/PropertySearchBehaviorTracker';
import { PropertySort } from '../../components/properties/PropertySort';
import { getProperties } from '../../features/properties/properties.api';
import {
    PropertyListQuery,
    PropertySortBy,
    PropertySortOrder,
    PropertyType,
    TransactionType,
} from '../../features/properties/properties.types';

export const dynamic = 'force-dynamic';

type PageSearchParams = Record<string, string | string[] | undefined>;

interface PropertiesPageProps {
    searchParams: Promise<PageSearchParams>;
}

const transactionTypes: TransactionType[] = ['SELL', 'RENT', 'UNKNOWN'];
const propertyTypes: PropertyType[] = ['APARTMENT', 'HOUSE', 'LAND', 'VILLA', 'ROOM', 'UNKNOWN'];
const sortByValues: PropertySortBy[] = ['createdAt', 'price', 'area', 'title'];
const sortOrderValues: PropertySortOrder[] = ['asc', 'desc'];

const getFirstValue = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
};

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
};

const parsePositiveNumber = (value: string | undefined) => {
    if (!value) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const isTransactionType = (value: string | undefined): value is TransactionType => {
    return transactionTypes.includes(value as TransactionType);
};

const isPropertyType = (value: string | undefined): value is PropertyType => {
    return propertyTypes.includes(value as PropertyType);
};

const isSortBy = (value: string | undefined): value is PropertySortBy => {
    return sortByValues.includes(value as PropertySortBy);
};

const isSortOrder = (value: string | undefined): value is PropertySortOrder => {
    return sortOrderValues.includes(value as PropertySortOrder);
};

const buildPropertyQuery = (searchParams: PageSearchParams): PropertyListQuery => {
    const keyword = getFirstValue(searchParams.keyword)?.trim();
    const transactionType = getFirstValue(searchParams.transactionType);
    const propertyType = getFirstValue(searchParams.propertyType);
    const province = getFirstValue(searchParams.province)?.trim();
    const district = getFirstValue(searchParams.district)?.trim();
    const sortBy = getFirstValue(searchParams.sortBy);
    const sortOrder = getFirstValue(searchParams.sortOrder);

    return {
        page: parsePositiveInteger(getFirstValue(searchParams.page), 1),
        limit: parsePositiveInteger(getFirstValue(searchParams.limit), 9),
        keyword: keyword || undefined,
        transactionType: isTransactionType(transactionType) ? transactionType : undefined,
        propertyType: isPropertyType(propertyType) ? propertyType : undefined,
        minPrice: parsePositiveNumber(getFirstValue(searchParams.minPrice)),
        maxPrice: parsePositiveNumber(getFirstValue(searchParams.maxPrice)),
        minArea: parsePositiveNumber(getFirstValue(searchParams.minArea)),
        maxArea: parsePositiveNumber(getFirstValue(searchParams.maxArea)),
        province: province || undefined,
        district: district || undefined,
        sortBy: isSortBy(sortBy) ? sortBy : undefined,
        sortOrder: isSortOrder(sortOrder) ? sortOrder : undefined,
    };
};

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Không thể tải danh sách bất động sản.';
};

async function PropertiesResult({ query }: { query: PropertyListQuery }) {
    try {
        const result = await getProperties(query, {
            cache: 'no-store',
        });

        if (result.items.length < 1) {
            return (
                <EmptyState
                    title="Không tìm thấy bất động sản phù hợp"
                    description="Không tìm thấy bất động sản phù hợp với bộ lọc hiện tại. Hãy thử nới khoảng giá, diện tích hoặc đổi khu vực."
                    actionHref="/properties"
                    actionLabel="Xóa bộ lọc"
                />
            );
        }

        return <PropertyList items={result.items} meta={result.meta} query={query} />;
    } catch (error) {
        return (
            <ErrorState
                title="Không thể tải danh sách"
                message={getErrorMessage(error)}
                actionHref="/properties"
                actionLabel="Thử lại"
            />
        );
    }
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
    const resolvedSearchParams = await searchParams;
    const query = buildPropertyQuery(resolvedSearchParams);

    return (
        <main className="page-shell">
            <section className="page-header">
                <div>
                    <p className="eyebrow">HomeSense</p>
                    <h1>Bất động sản</h1>
                    <p className="page-description">
                        Tìm kiếm và lọc bất động sản theo nhu cầu của bạn.
                    </p>
                </div>
            </section>

            <PropertyFilter query={query} />
            <PropertySearchBehaviorTracker query={query} />
            <PropertySort query={query} />
            <PropertyActiveFilters query={query} />

            <Suspense fallback={<Loading label="Đang tải danh sách bất động sản..." />}>
                <PropertiesResult query={query} />
            </Suspense>
        </main>
    );
}
