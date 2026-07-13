'use client';

import { useCurrentUser } from '../../../features/auth/use-current-user';
import { AuthRequired } from '../../../components/auth/AuthRequired';
import { ProfileForm } from '../../../components/users/ProfileForm';
import { Loading } from '../../../components/common/Loading';

function ProfileContent() {
    const { user, token, isLoading } = useCurrentUser();

    if (isLoading) {
        return <Loading label="Đang tải thông tin..." />;
    }

    if (!user || !token) return null;

    return (
        <div className="dashboard-page">
            <div className="dashboard-page-header">
                <p className="eyebrow">Dashboard</p>
                <h1>Hồ sơ cá nhân</h1>
                <p className="page-description">
                    Xem và cập nhật thông tin tài khoản của bạn.
                </p>
            </div>

            <ProfileForm user={user} token={token} />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <AuthRequired>
            <ProfileContent />
        </AuthRequired>
    );
}
