import { Property, PropertyListQuery } from '../../features/properties/properties.types';
import { PaginationMeta } from '../../types/api-response.type';
import { PropertyCard } from './PropertyCard';
import { PropertyPagination } from './PropertyPagination';

interface PropertyListProps {
    items: Property[];
    meta: PaginationMeta;
    query: PropertyListQuery;
}

export function PropertyList({ items, meta, query }: PropertyListProps) {
    return (
        <section className="list-section">
            <div className="list-summary">
                <p>
                    Tìm thấy <strong>{meta.total}</strong> bất động sản phù hợp
                </p>
                <p>
                    Trang {meta.page} / {Math.max(meta.totalPages, 1)}
                </p>
            </div>

            <div className="property-grid">
                {items.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>

            <PropertyPagination meta={meta} query={query} />
        </section>
    );
}
