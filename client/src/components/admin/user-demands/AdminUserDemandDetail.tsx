'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AdminUserDemand } from '../../../features/admin-user-demands/admin-user-demands.types';
import { formatArea, formatDate, formatPrice } from '../../../lib/format';
import { AdminUserDemandStatusSelect } from './AdminUserDemandStatusSelect';

interface AdminUserDemandDetailProps {
    initialDemand: AdminUserDemand;
    token: string;
}

export function AdminUserDemandDetail({ initialDemand, token }: AdminUserDemandDetailProps) {
    const [demand, setDemand] = useState(initialDemand);

    return (
        <div className="admin-detail-grid">
            <section className="admin-detail-section">
                <div className="admin-detail-heading">
                    <div>
                        <p className="eyebrow">{demand.status}</p>
                        <h2>{demand.demandType}</h2>
                    </div>
                    <AdminUserDemandStatusSelect
                        demand={demand}
                        token={token}
                        onUpdated={setDemand}
                    />
                </div>
                <dl className="admin-info-list">
                    <div>
                        <dt>Property types</dt>
                        <dd>{demand.propertyTypes.join(', ') || '—'}</dd>
                    </div>
                    <div>
                        <dt>External user</dt>
                        <dd>{demand.externalUserRef ?? '—'}</dd>
                    </div>
                    <div>
                        <dt>Confidence</dt>
                        <dd>{Math.round(demand.sourceConfidence * 100)}%</dd>
                    </div>
                    <div>
                        <dt>Cập nhật</dt>
                        <dd>{formatDate(demand.updatedAt)}</dd>
                    </div>
                </dl>
            </section>

            <section className="admin-detail-section">
                <h2>Nhu cầu</h2>
                <dl className="admin-info-list">
                    <div>
                        <dt>Ngân sách</dt>
                        <dd>{formatPrice(demand.minPrice)} - {formatPrice(demand.maxPrice)}</dd>
                    </div>
                    <div>
                        <dt>Diện tích</dt>
                        <dd>{formatArea(demand.minArea)} - {formatArea(demand.maxArea)}</dd>
                    </div>
                    <div>
                        <dt>Vị trí</dt>
                        <dd>{[demand.province, demand.district, demand.rawLocation].filter(Boolean).join(' · ') || '—'}</dd>
                    </div>
                    <div>
                        <dt>Liên hệ</dt>
                        <dd>{demand.contactPhone ?? '—'}</dd>
                    </div>
                </dl>
            </section>

            <section className="admin-detail-section">
                <h2>Raw signals liên quan</h2>
                {demand.signals.length > 0 ? (
                    <div className="admin-analysis-list">
                        {demand.signals.map((signal) => (
                            <Link
                                key={signal.id}
                                href={`/admin/user-signals/${signal.rawUserSignalId}`}
                                className="admin-linked-card"
                            >
                                <strong>{signal.sourceName}</strong>
                                <span>{signal.rawUserSignalId}</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="admin-muted">Chưa có signal liên quan.</p>
                )}
            </section>

            <section className="admin-detail-section">
                <h2>Analysis gần nhất</h2>
                {demand.latestAnalysis ? (
                    <pre className="admin-raw-content">
                        {JSON.stringify(demand.latestAnalysis.result ?? demand.latestAnalysis, null, 2)}
                    </pre>
                ) : (
                    <p className="admin-muted">Chưa có analysis.</p>
                )}
            </section>
        </div>
    );
}
