'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Maximize, Calendar, HeartOff, Eye } from 'lucide-react';
import { removeFavorite } from '../../features/favorites/favorites.api';
import { FavoriteListItem } from '../../features/favorites/favorites.types';
import { formatPrice, formatDate } from '../../lib/format';

interface FavoritePropertyCardProps {
    item: FavoriteListItem;
    token: string;
    onRemoved: (propertyId: string) => void;
}

const formatArea = (area?: number | null) => {
    if (area === null || area === undefined) return 'Chưa có DT';
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(area)} m²`;
};

export function FavoritePropertyCard({
    item,
    token,
    onRemoved,
}: FavoritePropertyCardProps) {
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState('');
    const property = item.property;

    const handleRemove = async () => {
        setIsRemoving(true);
        setError('');

        try {
            await removeFavorite(item.propertyId, token);
            onRemoved(item.propertyId);
        } catch (removeError) {
            setError(
                removeError instanceof Error
                    ? removeError.message
                    : 'Không thể bỏ lưu. Vui lòng thử lại.',
            );
            setIsRemoving(false);
        }
    };

    return (
        <article className="fav-card">
            <div className="fav-card-body">
                <div className="tag-row">
                    <span className="tag">{property.transactionType === 'SELL' ? 'Bán' : property.transactionType === 'RENT' ? 'Cho thuê' : 'Chưa rõ'}</span>
                    <span className="tag tag-muted">{property.propertyType}</span>
                </div>

                <h3>
                    <Link href={`/properties/${property.id}`}>
                        {property.title}
                    </Link>
                </h3>

                <div className="property-metrics">
                    <strong>{formatPrice(property.price)}</strong>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Maximize size={16} />
                        {formatArea(property.area)}
                    </span>
                </div>

                <p className="fav-card-address" style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-light)' }} />
                    <span>{property.location?.rawAddress ?? 'Chưa có địa chỉ'}</span>
                </p>

                <p className="fav-card-date" style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Calendar size={14} />
                    <span>Lưu lúc {formatDate(item.createdAt)}</span>
                </p>
            </div>

            <div className="fav-card-actions">
                <Link
                    href={`/properties/${property.id}`}
                    className="button-secondary"
                    style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Eye size={16} /> Xem chi tiết
                </Link>
                <button
                    type="button"
                    className="button-secondary"
                    onClick={handleRemove}
                    disabled={isRemoving}
                    style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}
                >
                    <HeartOff size={16} /> {isRemoving ? 'Đang bỏ lưu...' : 'Bỏ lưu'}
                </button>
            </div>

            {error ? <p className="form-error">{error}</p> : null}
        </article>
    );
}
