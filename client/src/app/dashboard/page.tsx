'use client';

import { useEffect, useState } from 'react';
import { Building2, Heart, MessageSquare, User } from 'lucide-react';
import { getFavorites } from '../../features/favorites/favorites.api';
import { getMyInquiries } from '../../features/inquiries/inquiries.api';
import { getMyProperties } from '../../features/properties/properties.api';
import { useCurrentUser } from '../../features/auth/use-current-user';
import { AuthRequired } from '../../components/auth/AuthRequired';
import { DashboardStatCard } from '../../components/dashboard/DashboardStatCard';
import { Loading } from '../../components/common/Loading';

function DashboardOverview() {
    const { user, token, isLoading } = useCurrentUser();
    const [favCount, setFavCount] = useState<number | null>(null);
    const [inquiryCount, setInquiryCount] = useState<number | null>(null);
    const [propertyCount, setPropertyCount] = useState<number | null>(null);

    useEffect(() => {
        if (!token) return;

        getFavorites({ page: 1, limit: 1 }, token)
            .then((result) => setFavCount(result.meta.total))
            .catch(() => setFavCount(null));

        getMyInquiries({ page: 1, limit: 1 }, token)
            .then((result) => setInquiryCount(result.meta.total))
            .catch(() => setInquiryCount(null));

        getMyProperties({ page: 1, limit: 1 }, token)
            .then((result) => setPropertyCount(result.meta.total))
            .catch(() => setPropertyCount(null));
    }, [token]);

    if (isLoading) {
        return <Loading label="Đang tải tổng quan..." />;
    }

    if (!user) {
        // AuthRequired đã xử lý trường hợp này, không cần render gì
        return null;
    }

    const displayName = user.fullName ?? user.email;

    return (
        <div className="dashboard-page">
            <div className="dashboard-page-header">
                <p className="eyebrow">Dashboard</p>
                <h1>Xin chào, {displayName}</h1>
                <p className="page-description">{user.email}</p>
            </div>

            <div className="stat-grid">
                <DashboardStatCard
                    label="Tin đã lưu"
                    value={favCount}
                    href="/dashboard/favorites"
                    actionLabel="Xem danh sách"
                    icon={Heart}
                />
                <DashboardStatCard
                    label="Tin đăng của tôi"
                    value={propertyCount}
                    href="/dashboard/properties"
                    actionLabel="Quản lý"
                    icon={Building2}
                />
                <DashboardStatCard
                    label="Yêu cầu liên hệ"
                    value={inquiryCount}
                    href="/dashboard/inquiries"
                    actionLabel="Xem danh sách"
                    icon={MessageSquare}
                />
                <DashboardStatCard
                    label="Hồ sơ cá nhân"
                    value="—"
                    href="/dashboard/profile"
                    actionLabel="Cập nhật"
                    icon={User}
                />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <AuthRequired>
            <DashboardOverview />
        </AuthRequired>
    );
}
