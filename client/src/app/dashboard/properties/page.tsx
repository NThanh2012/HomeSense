'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Edit3, Eye, Send } from 'lucide-react';
import { AuthRequired } from '../../../components/auth/AuthRequired';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { useCurrentUser } from '../../../features/auth/use-current-user';
import {
    getMyProperties,
    submitMyProperty,
} from '../../../features/properties/properties.api';
import { Property } from '../../../features/properties/properties.types';
import {
    formatArea,
    formatDate,
    formatPrice,
    formatPropertyStatus,
    formatPropertyType,
    formatTransactionType,
} from '../../../lib/format';
import { PaginationMeta } from '../../../types/api-response.type';

const PAGE_LIMIT = 10;

function MyPropertiesContent() {
    const { token, isLoading: isAuthLoading } = useCurrentUser();
    const [items, setItems] = useState<Property[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState('');
    const [error, setError] = useState('');

    const fetchPage = (targetPage: number, authToken: string) => {
        setIsLoading(true);
        setError('');

        getMyProperties({ page: targetPage, limit: PAGE_LIMIT }, authToken)
            .then((result) => {
                setItems(result.items);
                setMeta(result.meta);
                setPage(targetPage);
            })
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải tin đăng của bạn.',
                );
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (!token) {
            return;
        }

        fetchPage(1, token);
    }, [token]);

    const handleSubmitForReview = async (propertyId: string) => {
        if (!token) {
            return;
        }

        setSubmittingId(propertyId);
        setError('');

        try {
            const updated = await submitMyProperty(propertyId, token);
            setItems((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Không thể gửi duyệt tin đăng.',
            );
        } finally {
            setSubmittingId('');
        }
    };

    if (isAuthLoading || isLoading) {
        return <Loading label="Đang tải tin đăng..." />;
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-page-header dashboard-page-header-row">
                <div>
                    <p className="eyebrow">Tin đăng</p>
                    <h1>Tin đăng của tôi</h1>
                    <p className="page-description">
                        Tạo bài bán/cho thuê bằng form có cấu trúc, gửi admin duyệt trước khi công khai.
                    </p>
                </div>
                <Link href="/dashboard/properties/new" className="button-primary">
                    Đăng tin mới
                </Link>
            </div>

            {error ? <ErrorState title="Không thể xử lý tin đăng" message={error} /> : null}

            {!error && items.length < 1 ? (
                <EmptyState
                    title="Bạn chưa có tin đăng"
                    description="Tạo tin nháp đầu tiên để gửi admin duyệt."
                    actionHref="/dashboard/properties/new"
                    actionLabel="Đăng tin mới"
                />
            ) : null}

            {!error && items.length > 0 ? (
                <>
                    <div className="list-summary">
                        <p>
                            {meta?.total ?? 0} tin · Trang {page}/{meta?.totalPages ?? 1}
                        </p>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Tin</th>
                                    <th>Loại</th>
                                    <th>Giá</th>
                                    <th>Trạng thái</th>
                                    <th>Cập nhật</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((property) => (
                                    <tr key={property.id}>
                                        <td>
                                            <Link
                                                href={`/dashboard/properties/${property.id}`}
                                                className="admin-table-title"
                                            >
                                                {property.title}
                                            </Link>
                                            <span>{property.location?.rawAddress ?? 'Chưa có địa chỉ'}</span>
                                        </td>
                                        <td>
                                            {formatTransactionType(property.transactionType)} · {formatPropertyType(property.propertyType)}
                                            <span>{formatArea(property.area)}</span>
                                        </td>
                                        <td>{formatPrice(property.price)}</td>
                                        <td>{formatPropertyStatus(property.status)}</td>
                                        <td>{formatDate(property.updatedAt)}</td>
                                        <td>
                                            <div className="table-actions">
                                                <Link
                                                    href={`/dashboard/properties/${property.id}`}
                                                    className="button-secondary"
                                                    title="Sửa tin"
                                                >
                                                    <Edit3 size={16} />
                                                </Link>
                                                {property.status === 'DRAFT' ? (
                                                    <button
                                                        type="button"
                                                        className="button-primary"
                                                        title="Gửi duyệt"
                                                        disabled={submittingId === property.id}
                                                        onClick={() => handleSubmitForReview(property.id)}
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                ) : null}
                                                {property.status === 'PUBLISHED' ? (
                                                    <Link
                                                        href={`/properties/${property.id}`}
                                                        className="button-secondary"
                                                        title="Xem ngoài site"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {meta && meta.totalPages > 1 ? (
                        <div className="pagination">
                            <button
                                type="button"
                                className={page <= 1 ? 'button-disabled' : 'button-secondary'}
                                disabled={page <= 1 || !token}
                                onClick={() => token && fetchPage(page - 1, token)}
                            >
                                Trước
                            </button>
                            <span className="pagination-current">
                                {page} / {meta.totalPages}
                            </span>
                            <button
                                type="button"
                                className={page >= meta.totalPages ? 'button-disabled' : 'button-secondary'}
                                disabled={page >= meta.totalPages || !token}
                                onClick={() => token && fetchPage(page + 1, token)}
                            >
                                Sau
                            </button>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}

export default function MyPropertiesPage() {
    return (
        <AuthRequired>
            <MyPropertiesContent />
        </AuthRequired>
    );
}
