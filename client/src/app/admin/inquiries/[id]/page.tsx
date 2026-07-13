'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { AdminInquiryStatusSelect } from '../../../../components/admin/inquiries/AdminInquiryStatusSelect';
import { ErrorState } from '../../../../components/common/ErrorState';
import { Loading } from '../../../../components/common/Loading';
import { getAdminInquiryById } from '../../../../features/admin/admin.api';
import { AdminInquiry } from '../../../../features/admin/admin.types';
import { InquiryStatusBadge } from '../../../../components/inquiries/InquiryStatusBadge';

function AdminInquiryDetailContent({ token, id }: { token: string; id: string }) {
    const [inquiry, setInquiry] = useState<AdminInquiry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsLoading(true);
        setError('');

        getAdminInquiryById(id, token)
            .then((result) => setInquiry(result))
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải inquiry.',
                );
            })
            .finally(() => setIsLoading(false));
    }, [id, token]);

    if (isLoading) {
        return <Loading label="Đang tải inquiry..." />;
    }

    if (error) {
        return <ErrorState title="Không thể tải inquiry" message={error} />;
    }

    if (!inquiry) {
        return null;
    }

    return (
        <div className="admin-page">
            <div className="back-row">
                <Link href="/admin/inquiries" className="text-link">
                    Về danh sách
                </Link>
            </div>
            <AdminHeader title="Chi tiết yêu cầu tư vấn" description={inquiry.id} />

            <div className="admin-detail-grid">
                <section className="admin-detail-section">
                    <h2>Trạng thái</h2>
                    <div className="admin-inline-status">
                        <InquiryStatusBadge status={inquiry.status} />
                        <AdminInquiryStatusSelect
                            inquiry={inquiry}
                            token={token}
                            onUpdated={setInquiry}
                        />
                    </div>
                </section>

                <section className="admin-detail-section">
                    <h2>User</h2>
                    <p>{inquiry.user.fullName ?? inquiry.user.email}</p>
                    <p className="admin-muted">{inquiry.user.email}</p>
                    {inquiry.user.phone ? <p className="admin-muted">{inquiry.user.phone}</p> : null}
                </section>

                <section className="admin-detail-section">
                    <h2>Property</h2>
                    <Link href={`/admin/properties/${inquiry.propertyId}`} className="admin-table-title">
                        {inquiry.property.title}
                    </Link>
                    <p className="admin-muted">{inquiry.property.status}</p>
                </section>

                <section className="admin-detail-section">
                    <h2>Nội dung yêu cầu</h2>
                    <p className="admin-pre-line">{inquiry.message}</p>
                    <p className="admin-muted">
                        {[inquiry.contactName, inquiry.contactPhone].filter(Boolean).join(' · ')}
                    </p>
                </section>
            </div>
        </div>
    );
}

export default function AdminInquiryDetailPage() {
    const params = useParams<{ id: string }>();

    return (
        <AdminRequired>
            {({ token }) => <AdminInquiryDetailContent token={token} id={params.id} />}
        </AdminRequired>
    );
}
