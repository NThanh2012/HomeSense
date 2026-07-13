import Link from 'next/link';
import { PropertyListQuery } from '../../features/properties/properties.types';
import { PaginationMeta } from '../../types/api-response.type';

interface PropertyPaginationProps {
    meta: PaginationMeta;
    query: PropertyListQuery;
}

const buildPageHref = (query: PropertyListQuery, page: number) => {
    const params = new URLSearchParams();
    const nextQuery: PropertyListQuery = {
        ...query,
        page: page,
    };

    Object.entries(nextQuery).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        params.set(key, String(value));
    });

    const search = params.toString();
    return search ? `/properties?${search}` : '/properties';
};

export function PropertyPagination({ meta, query }: PropertyPaginationProps) {
    if (meta.totalPages <= 1) {
        return null;
    }

    const hasPrevious = meta.page > 1;
    const hasNext = meta.page < meta.totalPages;

    return (
        <nav className="pagination" aria-label="Phân trang bất động sản">
            {hasPrevious ? (
                <Link href={buildPageHref(query, meta.page - 1)} className="button-secondary">
                    Trang trước
                </Link>
            ) : (
                <span className="button-disabled">Trang trước</span>
            )}

            <span className="pagination-current">
                {meta.page} / {meta.totalPages}
            </span>

            {hasNext ? (
                <Link href={buildPageHref(query, meta.page + 1)} className="button-secondary">
                    Trang sau
                </Link>
            ) : (
                <span className="button-disabled">Trang sau</span>
            )}
        </nav>
    );
}
