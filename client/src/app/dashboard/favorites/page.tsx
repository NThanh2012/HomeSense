'use client';

import { useCurrentUser } from '../../../features/auth/use-current-user';
import { AuthRequired } from '../../../components/auth/AuthRequired';
import { FavoritePropertyList } from '../../../components/favorites/FavoritePropertyList';
import { Loading } from '../../../components/common/Loading';

function FavoritesContent() {
    const { token, isLoading } = useCurrentUser();

    if (isLoading) {
        return <Loading label="Đang tải..." />;
    }

    if (!token) return null;

    return (
        <div className="dashboard-page">
            <div className="dashboard-page-header">
                <p className="eyebrow">Dashboard</p>
                <h1>Tin đã lưu</h1>
                <p className="page-description">
                    Danh sách bất động sản bạn đã lưu để xem lại sau.
                </p>
            </div>

            <FavoritePropertyList token={token} />
        </div>
    );
}

export default function FavoritesPage() {
    return (
        <AuthRequired>
            <FavoritesContent />
        </AuthRequired>
    );
}
