import Link from 'next/link';
import { MapPin, Maximize } from 'lucide-react';
import { Property } from '../../features/properties/properties.types';
import {
    formatArea,
    formatPrice,
    propertyTypeLabels,
    transactionTypeLabels,
} from '../../lib/format';

interface PropertyCardProps {
    property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
    const image = property.media.find((item) => item.type === 'IMAGE')?.url;
    const address = property.location?.rawAddress ?? 'Chưa có địa chỉ';

    return (
        <article className="property-card">
            <Link href={`/properties/${property.id}`} className="property-card-media">
                {image ? <img src={image} alt={property.title} /> : <span>Chưa có ảnh</span>}
            </Link>

            <div className="property-card-body">
                <div className="tag-row">
                    <span className="tag">{transactionTypeLabels[property.transactionType]}</span>
                    <span className="tag tag-muted">{propertyTypeLabels[property.propertyType]}</span>
                </div>

                <h2>
                    <Link href={`/properties/${property.id}`}>{property.title}</Link>
                </h2>

                <div className="property-metrics">
                    <strong>{formatPrice(property.price)}</strong>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Maximize size={16} />
                        {formatArea(property.area)}
                    </span>
                </div>

                <p className="property-address" style={{ display: 'flex', gap: '6px' }}>
                    <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-light)' }} />
                    <span>{address}</span>
                </p>
            </div>
        </article>
    );
}

export { formatArea, formatPrice, propertyTypeLabels, transactionTypeLabels };
