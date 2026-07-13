'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminRequired } from '../../components/admin/AdminRequired';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { ErrorState } from '../../components/common/ErrorState';
import { Loading } from '../../components/common/Loading';
import { getAdminOverview } from '../../features/admin/admin.api';
import { AdminOverview } from '../../features/admin/admin.types';

function AdminOverviewContent({ token }: { token: string }) {
    const [overview, setOverview] = useState<AdminOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsLoading(true);
        setError('');

        getAdminOverview(token)
            .then((result) => setOverview(result))
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải tổng quan admin.',
                );
            })
            .finally(() => setIsLoading(false));
    }, [token]);

    if (isLoading) {
        return <Loading label="Đang tải tổng quan admin..." />;
    }

    if (error) {
        return <ErrorState title="Không thể tải admin" message={error} />;
    }

    if (!overview) {
        return null;
    }

    return (
        <div className="admin-page">
            <AdminHeader
                title="Tổng quan quản trị"
                description="Theo dõi nhanh dữ liệu chính trong hệ thống HomeSense."
            />

            <div className="admin-stat-grid">
                <AdminStatCard
                    label="Bất động sản"
                    value={overview.totalProperties}
                    href="/admin/properties"
                    actionLabel="Quản lý"
                />
                <AdminStatCard
                    label="Yêu cầu tư vấn"
                    value={overview.totalInquiries}
                    href="/admin/inquiries"
                    actionLabel="Xử lý"
                />
                <AdminStatCard label="Người dùng" value={overview.totalUsers} />
            </div>

            <section className="admin-detail-section">
                <h2>Trạng thái tin đăng</h2>
                <div className="admin-status-grid">
                    <AdminStatCard label="PUBLISHED" value={overview.propertiesByStatus.PUBLISHED} />
                    <AdminStatCard label="PENDING_REVIEW" value={overview.propertiesByStatus.PENDING_REVIEW} />
                    <AdminStatCard label="DRAFT" value={overview.propertiesByStatus.DRAFT} />
                    <AdminStatCard label="ARCHIVED" value={overview.propertiesByStatus.ARCHIVED} />
                    <AdminStatCard label="Inquiry mới" value={overview.pendingInquiries} />
                </div>
            </section>
        </div>
    );
}

export default function AdminPage() {
    return (
        <AdminRequired>
            {({ token }) => <AdminOverviewContent token={token} />}
        </AdminRequired>
    );
}
