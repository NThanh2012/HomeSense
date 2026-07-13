'use client';

import { useCurrentUser } from '../../../features/auth/use-current-user';
import { AuthRequired } from '../../../components/auth/AuthRequired';
import { InquiryList } from '../../../components/inquiries/InquiryList';
import { Loading } from '../../../components/common/Loading';

function InquiriesContent() {
    const { token, isLoading } = useCurrentUser();

    if (isLoading) {
        return <Loading label="Đang tải..." />;
    }

    if (!token) return null;

    return (
        <div className="dashboard-page">
            <div className="dashboard-page-header">
                <p className="eyebrow">Dashboard</p>
                <h1>Yêu cầu liên hệ</h1>
                <p className="page-description">
                    Danh sách yêu cầu tư vấn bạn đã gửi, kèm trạng thái xử lý.
                </p>
            </div>

            <InquiryList token={token} />
        </div>
    );
}

export default function InquiriesPage() {
    return (
        <AuthRequired>
            <InquiriesContent />
        </AuthRequired>
    );
}
