'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, RefreshCcw } from 'lucide-react';
import {
    getAdminDemandMatches,
    updateAdminMatchStatus,
} from '../../../features/recommendations/api';
import {
    DemandMatchStatus,
    DemandPropertyMatch,
} from '../../../features/recommendations/types';
import { getStoredToken } from '../../../features/auth/auth.api';
import { formatPrice } from '../../../lib/format';
import { MatchReasonsList } from '../../recommendations/MatchReasonsList';
import { MatchScoreBadge } from '../../recommendations/MatchScoreBadge';

interface MatchListProps {
    demandId: string;
    refreshKey?: number;
}

type StatusFilter = DemandMatchStatus | 'ALL';

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ACTIVE', label: 'Đang gợi ý' },
    { value: 'DISMISSED', label: 'Đã bỏ qua' },
    { value: 'CONTACTED', label: 'Đã liên hệ' },
    { value: 'OUTDATED', label: 'Đã cũ' },
    { value: 'ALL', label: 'Tất cả' },
];

const statusLabels: Record<DemandMatchStatus, string> = {
    ACTIVE: 'Đang gợi ý',
    DISMISSED: 'Đã bỏ qua',
    CONTACTED: 'Đã liên hệ',
    OUTDATED: 'Đã cũ',
};

export function MatchList({ demandId, refreshKey }: MatchListProps) {
    const [matches, setMatches] = useState<DemandPropertyMatch[]>([]);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMatches = useCallback(async () => {
        const token = getStoredToken() ?? '';
        setLoading(true);
        setError(null);
        try {
            const query = statusFilter === 'ALL'
                ? { limit: 20 }
                : { limit: 20, status: statusFilter };
            const res = await getAdminDemandMatches(demandId, token, query);
            setMatches(res.items ?? []);
            setTotal(res.meta?.total ?? 0);
        } catch (err: any) {
            setError(err?.message ?? 'Không thể tải danh sách gợi ý');
        } finally {
            setLoading(false);
        }
    }, [demandId, statusFilter]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches, refreshKey]);

    const handleStatusChange = async (matchId: string, status: DemandMatchStatus) => {
        const token = getStoredToken() ?? '';
        setUpdatingId(matchId);
        setError(null);

        try {
            const updated = await updateAdminMatchStatus(matchId, status, token);
            setMatches((current) => {
                if (statusFilter !== 'ALL' && updated.status !== statusFilter) {
                    setTotal((value) => Math.max(value - 1, 0));
                    return current.filter((item) => item.id !== matchId);
                }

                return current.map((item) => (item.id === matchId ? updated : item));
            });
        } catch (err: any) {
            setError(err?.message ?? 'Không thể cập nhật trạng thái gợi ý');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                    Kết quả gợi ý ({total} bất động sản)
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                        style={{ minHeight: '34px', borderRadius: '6px', border: '1px solid var(--line)', padding: '0 8px' }}
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <button
                        className="button-secondary"
                        onClick={fetchMatches}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', minHeight: 'auto' }}
                    >
                        <RefreshCcw size={14} /> Làm mới
                    </button>
                </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                    <div className="loading-spinner" />
                </div>
            )}

            {!loading && matches.length === 0 && (
                <div className="state-box">
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        Chưa có kết quả phù hợp với bộ lọc hiện tại.
                    </p>
                </div>
            )}

            {!loading && matches.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Điểm</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Bất động sản</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Giá</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Trạng thái</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Lý do gợi ý</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Xem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((match) => (
                                <tr key={match.id} style={{ borderBottom: '1px solid var(--line)' }}>
                                    <td style={{ padding: '12px' }}>
                                        <MatchScoreBadge score={match.matchScore} />
                                    </td>
                                    <td style={{ padding: '12px', maxWidth: '240px' }}>
                                        <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>
                                            {match.property?.title ?? match.propertyId}
                                        </p>
                                        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                                            {[match.property?.location?.district, match.property?.location?.province].filter(Boolean).join(', ') || 'Không rõ vị trí'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--danger-strong)' }}>
                                        {formatPrice(match.property?.price)}
                                    </td>
                                    <td style={{ padding: '12px', minWidth: '150px' }}>
                                        <select
                                            value={match.status}
                                            disabled={updatingId === match.id}
                                            onChange={(event) => handleStatusChange(match.id, event.target.value as DemandMatchStatus)}
                                            style={{ minHeight: '32px', borderRadius: '6px', border: '1px solid var(--line)', padding: '0 8px', width: '100%' }}
                                            aria-label={`Cập nhật trạng thái ${match.id}`}
                                        >
                                            {(statusOptions.filter((option) => option.value !== 'ALL') as Array<{ value: DemandMatchStatus; label: string }>).map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {statusLabels[option.value]}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '12px', maxWidth: '280px' }}>
                                        <MatchReasonsList reasons={match.matchReasons} />
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <Link
                                            href={`/properties/${match.propertyId}`}
                                            target="_blank"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, fontSize: '13px' }}
                                        >
                                            <ExternalLink size={14} /> Mở
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
