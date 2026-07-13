'use client';

import Link from 'next/link';
import { MapPin, Maximize2 } from 'lucide-react';
import {
    createRecommendationFeedback,
} from '../../features/recommendations/api';
import { DemandPropertyMatch } from '../../features/recommendations/types';
import {
    formatArea,
    formatPrice,
    formatPropertyType,
    formatTransactionType,
} from '../../lib/format';
import { MatchReasonsList } from '../recommendations/MatchReasonsList';
import { MatchScoreBadge } from '../recommendations/MatchScoreBadge';

interface RecommendationCardProps {
    match: DemandPropertyMatch;
    token?: string | null;
    onDismissed?: (matchId: string) => void;
}

export function RecommendationCard({ match, token, onDismissed }: RecommendationCardProps) {
    const property = match.property;
    if (!property) return null;

    const handleClick = () => {
        if (!token) return;

        void createRecommendationFeedback(match.id, 'CLICKED', token).catch(() => undefined);
    };

    const handleDismiss = async () => {
        if (!token) return;

        try {
            await createRecommendationFeedback(match.id, 'DISMISSED', token);
            onDismissed?.(match.id);
        } catch {
            // Feedback tracking must not break the recommendation list UI.
        }
    };

    return (
        <div className="property-card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                <MatchScoreBadge score={match.matchScore} />
            </div>

            <div className="property-card-media">
                {property.thumbnail ? (
                    <img src={property.thumbnail} alt={property.title} loading="lazy" />
                ) : (
                    <Maximize2 size={32} />
                )}
            </div>

            <div className="property-card-body">
                <div className="tag-row">
                    <span className="tag">{formatTransactionType(property.transactionType)}</span>
                    <span className="tag tag-muted">{formatPropertyType(property.propertyType)}</span>
                </div>

                <h2>
                    <Link href={`/properties/${property.id}`} onClick={handleClick}>
                        {property.title}
                    </Link>
                </h2>

                {property.location && (
                    <p className="property-address" style={{ display: 'flex', gap: '4px', alignItems: 'flex-start', fontSize: '14px' }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: '3px' }} />
                        {[property.location.district, property.location.province].filter(Boolean).join(', ')}
                    </p>
                )}

                <div className="property-metrics">
                    <strong>{formatPrice(property.price)}</strong>
                    {property.area && <span>{formatArea(property.area)}</span>}
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Lý do gợi ý
                    </p>
                    <MatchReasonsList reasons={match.matchReasons} />
                </div>

                <div className="recommendation-actions">
                    <Link href={`/properties/${property.id}`} className="button-primary" onClick={handleClick}>
                        Xem chi tiết
                    </Link>
                    <button type="button" className="button-secondary" onClick={handleDismiss}>
                        Bỏ qua
                    </button>
                </div>
            </div>
        </div>
    );
}
