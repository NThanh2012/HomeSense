'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { AdminUserDemandDetail } from '../../../../components/admin/user-demands/AdminUserDemandDetail';
import { ErrorState } from '../../../../components/common/ErrorState';
import { Loading } from '../../../../components/common/Loading';
import { getAdminUserDemandById } from '../../../../features/admin-user-demands/admin-user-demands.api';
import { AdminUserDemand } from '../../../../features/admin-user-demands/admin-user-demands.types';
import { MatchList } from '../../../../components/admin/recommendations/MatchList';
import { RunMatchButton } from '../../../../components/admin/recommendations/RunMatchButton';

function AdminUserDemandDetailContent({ token, id }: { token: string; id: string }) {
    const [demand, setDemand] = useState<AdminUserDemand | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [matchRefreshKey, setMatchRefreshKey] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        setError('');

        getAdminUserDemandById(id, token)
            .then(setDemand)
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải nhu cầu người dùng.',
                );
            })
            .finally(() => setIsLoading(false));
    }, [id, token]);

    return (
        <div className="admin-page">
            <AdminHeader
                title="Chi tiết Nhu cầu BĐS"
                description="Xem nhu cầu chuẩn hóa, tín hiệu liên quan và kết quả ghép nhu cầu."
            />

            {isLoading ? <Loading label="Đang tải nhu cầu..." /> : null}
            {error ? <ErrorState title="Có lỗi xảy ra" message={error} /> : null}
            {!isLoading && demand ? <AdminUserDemandDetail initialDemand={demand} token={token} /> : null}

            {/* ── Section Ghép Nhu Cầu BĐS ── */}
            {!isLoading && demand && (
                <div style={{
                    marginTop: '32px',
                    padding: '24px',
                    background: 'white',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                }}>
                    <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>Ghép Nhu Cầu BĐS</h2>
                    <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                        Hệ thống sẽ tìm các bất động sản phù hợp dựa trên tiêu chí: loại giao dịch, loại BĐS, khoảng giá, diện tích và khu vực.
                    </p>
                    <div style={{ marginBottom: '24px' }}>
                        <RunMatchButton
                            demandId={id}
                            onSuccess={() => setMatchRefreshKey((k) => k + 1)}
                        />
                    </div>
                    <MatchList demandId={id} refreshKey={matchRefreshKey} />
                </div>
            )}
        </div>
    );
}

export default function AdminUserDemandDetailPage() {
    const params = useParams<{ id: string }>();

    return (
        <AdminRequired>
            {({ token }) => <AdminUserDemandDetailContent token={token} id={params.id} />}
        </AdminRequired>
    );
}
