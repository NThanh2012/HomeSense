'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { AdminPropertyStatusSelect } from '../../../../components/admin/properties/AdminPropertyStatusSelect';
import { ErrorState } from '../../../../components/common/ErrorState';
import { Loading } from '../../../../components/common/Loading';
import { getAdminPropertyById } from '../../../../features/admin/admin.api';
import { Property } from '../../../../features/properties/properties.types';

const formatPrice = (value?: number | null) => {
    if (!value) {
        return 'Chưa có giá';
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

function AdminPropertyDetailContent({ token, id }: { token: string; id: string }) {
    const [property, setProperty] = useState<Property | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsLoading(true);
        setError('');

        getAdminPropertyById(id, token)
            .then((result) => setProperty(result))
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải chi tiết bất động sản.',
                );
            })
            .finally(() => setIsLoading(false));
    }, [id, token]);

    if (isLoading) {
        return <Loading label="Đang tải chi tiết bất động sản..." />;
    }

    if (error) {
        return <ErrorState title="Không thể tải chi tiết" message={error} />;
    }

    if (!property) {
        return null;
    }

    return (
        <div className="admin-page">
            <div className="back-row">
                <Link href="/admin/properties" className="text-link">
                    Về danh sách
                </Link>
            </div>
            <AdminHeader title={property.title} description={property.location?.rawAddress ?? undefined} />

            <div className="admin-detail-grid">
                <section className="admin-detail-section">
                    <h2>Trạng thái</h2>
                    <AdminPropertyStatusSelect
                        property={property}
                        token={token}
                        onUpdated={setProperty}
                    />
                </section>

                <section className="admin-detail-section">
                    <h2>Thông tin chính</h2>
                    <dl className="admin-info-list">
                        <div>
                            <dt>Giá</dt>
                            <dd>{formatPrice(property.price)}</dd>
                        </div>
                        <div>
                            <dt>Diện tích</dt>
                            <dd>{property.area ? `${property.area} m2` : '—'}</dd>
                        </div>
                        <div>
                            <dt>Loại</dt>
                            <dd>{property.transactionType} · {property.propertyType}</dd>
                        </div>
                        <div>
                            <dt>Phòng ngủ</dt>
                            <dd>{property.bedrooms ?? '—'}</dd>
                        </div>
                        <div>
                            <dt>Phòng tắm</dt>
                            <dd>{property.bathrooms ?? '—'}</dd>
                        </div>
                        <div>
                            <dt>Nội thất</dt>
                            <dd>{property.furnishingStatus ?? '—'}</dd>
                        </div>
                        <div>
                            <dt>Pháp lý</dt>
                            <dd>{property.legalStatus ?? '—'}</dd>
                        </div>
                        <div>
                            <dt>Hướng</dt>
                            <dd>{property.direction ?? '—'}</dd>
                        </div>
                        <div>
                            <dt>Số điện thoại liên hệ</dt>
                            <dd>{property.contactPhone ?? '—'}</dd>
                        </div>
                        <div>
                            <dt>Tiện ích</dt>
                            <dd>{property.amenities?.join(' · ') || '—'}</dd>
                        </div>
                    </dl>
                </section>

                <section className="admin-detail-section">
                    <h2>Người bán</h2>
                    {property.createdBy ? (
                        <dl className="admin-info-list">
                            <div>
                                <dt>Họ tên</dt>
                                <dd>{property.createdBy.fullName ?? '—'}</dd>
                            </div>
                            <div>
                                <dt>Email</dt>
                                <dd>{property.createdBy.email}</dd>
                            </div>
                            <div>
                                <dt>Số điện thoại tài khoản</dt>
                                <dd>{property.createdBy.phone ?? '—'}</dd>
                            </div>
                        </dl>
                    ) : (
                        <p className="admin-muted">Không có thông tin người bán.</p>
                    )}
                </section>

                <section className="admin-detail-section">
                    <h2>Mô tả</h2>
                    <p className="admin-pre-line">{property.description ?? 'Chưa có mô tả.'}</p>
                </section>

            </div>
        </div>
    );
}

export default function AdminPropertyDetailPage() {
    const params = useParams<{ id: string }>();

    return (
        <AdminRequired>
            {({ token }) => <AdminPropertyDetailContent token={token} id={params.id} />}
        </AdminRequired>
    );
}
