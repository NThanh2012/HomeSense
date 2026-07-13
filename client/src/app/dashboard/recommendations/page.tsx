'use client';

import { RefreshCw, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthRequired } from '../../../components/auth/AuthRequired';
import { Loading } from '../../../components/common/Loading';
import { RecommendationCard } from '../../../components/dashboard/RecommendationCard';
import { useCurrentUser } from '../../../features/auth/use-current-user';
import {
    createRecommendationFeedback,
    getMyRecommendations,
    recomputeMyRecommendations,
} from '../../../features/recommendations/api';
import { DemandPropertyMatch } from '../../../features/recommendations/types';

function RecommendationsContent() {
    const { token, isLoading: authLoading } = useCurrentUser();
    const viewedMatchIds = useRef<Set<string>>(new Set());
    const [matches, setMatches] = useState<DemandPropertyMatch[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isRecomputing, setIsRecomputing] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [backgroundChecks, setBackgroundChecks] = useState(0);

    const trackVisibleRecommendations = useCallback(
        (items: DemandPropertyMatch[]) => {
            if (!token) return;

            items.forEach((item) => {
                if (viewedMatchIds.current.has(item.id)) {
                    return;
                }

                viewedMatchIds.current.add(item.id);
                void createRecommendationFeedback(item.id, 'VIEWED', token).catch(() => undefined);
            });
        },
        [token],
    );

    const loadRecommendations = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError('');

        try {
            const res = await getMyRecommendations(token, { limit: 20 });
            const items = res.items ?? [];

            setMatches(items);
            setTotal(res.meta?.total ?? 0);
            trackVisibleRecommendations(items);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải gợi ý');
        } finally {
            setLoading(false);
        }
    }, [token, trackVisibleRecommendations]);

    useEffect(() => {
        void loadRecommendations();
    }, [loadRecommendations]);

    useEffect(() => {
        if (loading || error || matches.length > 0 || backgroundChecks >= 4) return;
        const timer = window.setTimeout(() => {
            setBackgroundChecks((current) => current + 1);
            void loadRecommendations();
        }, 15_000);
        return () => window.clearTimeout(timer);
    }, [backgroundChecks, error, loadRecommendations, loading, matches.length]);

    const handleDismissed = (matchId: string) => {
        setMatches((current) => current.filter((item) => item.id !== matchId));
        setTotal((current) => Math.max(0, current - 1));
        setMessage('Đã bỏ qua gợi ý.');
    };

    const handleRecompute = async () => {
        if (!token) return;

        setIsRecomputing(true);
        setMessage('');
        setError('');

        try {
            const result = await recomputeMyRecommendations(token);
            setMessage(
                `Đã tính lại ${result.demandCount} nhu cầu và ${result.matchedCount} kết quả ghép.`,
            );
            await loadRecommendations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tính lại gợi ý');
        } finally {
            setIsRecomputing(false);
        }
    };

    if (authLoading) {
        return <Loading label="Đang tải..." />;
    }

    if (!token) return null;

    return (
        <div className="dashboard-page">
            <div className="dashboard-page-header">
                <p className="eyebrow">Cá nhân hóa theo nhu cầu</p>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={28} color="var(--primary)" />
                    Gợi ý bất động sản
                </h1>
                <p className="page-description">
                    Danh sách bất động sản được hệ thống ghép tự động theo nhu cầu đã phân tích của bạn.
                </p>
                <button
                    type="button"
                    className="button-secondary"
                    onClick={handleRecompute}
                    disabled={isRecomputing || loading}
                    style={{ width: 'fit-content' }}
                >
                    <RefreshCw size={16} />
                    {isRecomputing ? 'Đang tính lại...' : 'Tính lại gợi ý'}
                </button>
            </div>

            {message ? <p className="form-success">{message}</p> : null}
            {!error && matches.length === 0 && backgroundChecks < 4 ? (
                <p className="form-success">Hệ thống đang cập nhật nhu cầu và sẽ tự tải lại gợi ý.</p>
            ) : null}

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
                    <div className="loading-spinner" />
                </div>
            )}

            {error && (
                <div className="state-box state-box-error">
                    <h2>Có lỗi xảy ra</h2>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && matches.length === 0 && (
                <div className="state-box">
                    <Sparkles size={40} color="var(--text-light)" />
                    <h2>Chưa có gợi ý nào</h2>
                    <p>
                        Hệ thống chưa ghép được bất động sản nào với nhu cầu của bạn.
                        Hãy tạo thêm tín hiệu tìm kiếm hoặc yêu cầu admin chạy phân tích nhu cầu.
                    </p>
                </div>
            )}

            {!loading && !error && matches.length > 0 && (
                <>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontWeight: 500 }}>
                        Tìm được <strong>{total}</strong> bất động sản phù hợp với nhu cầu của bạn
                    </p>
                    <div className="property-grid">
                        {matches.map((match) => (
                            <RecommendationCard
                                key={match.id}
                                match={match}
                                token={token}
                                onDismissed={handleDismissed}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function RecommendationsPage() {
    return (
        <AuthRequired>
            <RecommendationsContent />
        </AuthRequired>
    );
}
