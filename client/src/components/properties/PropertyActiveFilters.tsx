import Link from 'next/link';
import {
    PropertyListQuery,
    PropertySortBy,
    PropertySortOrder,
} from '../../features/properties/properties.types';
import {
    formatArea,
    formatPrice,
    propertyTypeLabels,
    transactionTypeLabels,
} from '../../lib/format';

interface PropertyActiveFiltersProps {
    query: PropertyListQuery;
}

interface FilterChip {
    key: string;
    label: string;
    removeKeys: Array<keyof PropertyListQuery>;
}

const sortByLabels: Record<PropertySortBy, string> = {
    createdAt: 'Ngày tạo',
    price: 'Giá',
    area: 'Diện tích',
    title: 'Tên A-Z',
};

const sortOrderLabels: Record<PropertySortOrder, string> = {
    asc: 'tăng dần',
    desc: 'giảm dần',
};

const buildHref = (query: PropertyListQuery, removeKeys: Array<keyof PropertyListQuery>) => {
    const params = new URLSearchParams();
    const removeSet = new Set<keyof PropertyListQuery>([...removeKeys, 'page']);

    Object.entries(query).forEach(([key, value]) => {
        if (removeSet.has(key as keyof PropertyListQuery)) {
            return;
        }

        if (value === undefined || value === null || value === '') {
            return;
        }

        params.set(key, String(value));
    });

    params.set('page', '1');

    const search = params.toString();
    return search ? `/properties?${search}` : '/properties';
};

const formatRange = (
    min: number | undefined,
    max: number | undefined,
    formatter: (value: number) => string,
) => {
    if (min !== undefined && max !== undefined) {
        return `${formatter(min)} - ${formatter(max)}`;
    }

    if (min !== undefined) {
        return `Từ ${formatter(min)}`;
    }

    if (max !== undefined) {
        return `Đến ${formatter(max)}`;
    }

    return '';
};

const buildChips = (query: PropertyListQuery): FilterChip[] => {
    const chips: FilterChip[] = [];

    if (query.keyword) {
        chips.push({
            key: 'keyword',
            label: `Từ khóa: ${query.keyword}`,
            removeKeys: ['keyword'],
        });
    }

    if (query.transactionType) {
        chips.push({
            key: 'transactionType',
            label: `Giao dịch: ${transactionTypeLabels[query.transactionType]}`,
            removeKeys: ['transactionType'],
        });
    }

    if (query.propertyType) {
        chips.push({
            key: 'propertyType',
            label: `Loại BĐS: ${propertyTypeLabels[query.propertyType]}`,
            removeKeys: ['propertyType'],
        });
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        chips.push({
            key: 'price',
            label: `Giá: ${formatRange(query.minPrice, query.maxPrice, formatPrice)}`,
            removeKeys: ['minPrice', 'maxPrice'],
        });
    }

    if (query.minArea !== undefined || query.maxArea !== undefined) {
        chips.push({
            key: 'area',
            label: `Diện tích: ${formatRange(query.minArea, query.maxArea, formatArea)}`,
            removeKeys: ['minArea', 'maxArea'],
        });
    }

    if (query.province) {
        chips.push({
            key: 'province',
            label: `Tỉnh/thành: ${query.province}`,
            removeKeys: ['province'],
        });
    }

    if (query.district) {
        chips.push({
            key: 'district',
            label: `Quận/huyện: ${query.district}`,
            removeKeys: ['district'],
        });
    }

    if (query.sortBy || query.sortOrder) {
        const sortBy = query.sortBy ?? 'createdAt';
        const sortOrder = query.sortOrder ?? 'desc';

        chips.push({
            key: 'sort',
            label: `Sắp xếp: ${sortByLabels[sortBy]} ${sortOrderLabels[sortOrder]}`,
            removeKeys: ['sortBy', 'sortOrder'],
        });
    }

    return chips;
};

export function PropertyActiveFilters({ query }: PropertyActiveFiltersProps) {
    const chips = buildChips(query);

    if (chips.length < 1) {
        return null;
    }

    return (
        <section className="active-filters" aria-label="Bộ lọc đang áp dụng">
            <div>
                <span className="active-filters-label">Đang lọc</span>
                <div className="active-filter-chip-row">
                    {chips.map((chip) => (
                        <Link
                            key={chip.key}
                            href={buildHref(query, chip.removeKeys)}
                            className="active-filter-chip"
                        >
                            {chip.label}
                            <span aria-hidden="true">×</span>
                        </Link>
                    ))}
                </div>
            </div>
            <Link href="/properties" className="active-filters-clear">
                Xóa tất cả
            </Link>
        </section>
    );
}
