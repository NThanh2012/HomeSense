'use client';

import Link from 'next/link';
import { AuthRequired } from '../../../../components/auth/AuthRequired';
import { Loading } from '../../../../components/common/Loading';
import { PropertyListingForm } from '../../../../components/dashboard/PropertyListingForm';
import { useCurrentUser } from '../../../../features/auth/use-current-user';

function NewPropertyContent() {
    const { token, isLoading } = useCurrentUser();

    if (isLoading) {
        return <Loading label="Đang kiểm tra đăng nhập..." />;
    }

    if (!token) {
        return null;
    }

    return (
        <div className="dashboard-page">
            <div className="back-row">
                <Link href="/dashboard/properties" className="text-link">
                    ← Quay lại tin đăng
                </Link>
            </div>

            <div className="dashboard-page-header">
                <p className="eyebrow">Tin đăng</p>
                <h1>Đăng tin mới</h1>
                <p className="page-description">
                    Người bán tự nhập thông tin bài đăng; hệ thống lưu nháp và chờ admin duyệt.
                </p>
            </div>

            <PropertyListingForm token={token} />
        </div>
    );
}

export default function NewPropertyPage() {
    return (
        <AuthRequired>
            <NewPropertyContent />
        </AuthRequired>
    );
}
