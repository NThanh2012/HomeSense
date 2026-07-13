'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyInquiries } from '../../features/inquiries/inquiries.api';
import { Inquiry } from '../../features/inquiries/inquiries.types';
import { PaginationMeta } from '../../types/api-response.type';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { Loading } from '../common/Loading';
import { InquiryStatusBadge } from './InquiryStatusBadge';
import { formatDate } from '../../lib/format';

interface InquiryListProps {
    token: string;
}

const PAGE_LIMIT = 10;

export function InquiryList({ token }: InquiryListProps) {
    const [items, setItems] = useState<Inquiry[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPage = (targetPage: number) => {
        setIsLoading(true);
        setError('');

        getMyInquiries({ page: targetPage, limit: PAGE_LIMIT }, token)
            .then((result) => {
                setItems(result.items);
                setMeta(result.meta);
                setPage(targetPage);
            })
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải danh sách yêu cầu liên hệ.',
                );
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    if (isLoading) {
        return <Loading label="Đang tải yêu cầu liên hệ..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Không thể tải danh sách"
                message={error}
                actionHref="/dashboard/inquiries"
                actionLabel="Thử lại"
            />
        );
    }

    if (items.length < 1) {
        return (
            <EmptyState
                title="Chưa có yêu cầu liên hệ"
                description="Bạn chưa gửi yêu cầu tư vấn nào. Hãy tìm bất động sản và gửi yêu cầu."
                actionHref="/properties"
                actionLabel="Xem bất động sản"
            />
        );
    }

    return (
        <div className="list-section">
            <div className="list-summary">
                <p>
                    {meta?.total ?? 0} yêu cầu · Trang {page}/{meta?.totalPages ?? 1}
                </p>
            </div>

            <div className="inquiry-list">
                {items.map((inquiry) => (
                    <article key={inquiry.id} className="inquiry-item">
                        <div className="inquiry-item-header">
                            <div>
                                <h3>
                                    <Link href={`/properties/${inquiry.propertyId}`}>
                                        {inquiry.property.title}
                                    </Link>
                                </h3>
                                <p className="inquiry-item-date">
                                    {formatDate(inquiry.createdAt)}
                                </p>
                            </div>
                            <InquiryStatusBadge status={inquiry.status} />
                        </div>

                        <p className="inquiry-item-message">{inquiry.message}</p>

                        {inquiry.contactName || inquiry.contactPhone ? (
                            <p className="inquiry-item-contact">
                                Liên hệ:{' '}
                                {[inquiry.contactName, inquiry.contactPhone]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        ) : null}

                        <div className="inquiry-item-footer">
                            <Link
                                href={`/properties/${inquiry.propertyId}`}
                                className="text-link"
                            >
                                Xem bất động sản →
                            </Link>
                        </div>
                    </article>
                ))}
            </div>

            {meta && meta.totalPages > 1 ? (
                <div className="pagination">
                    <button
                        type="button"
                        className={page <= 1 ? 'button-disabled' : 'button-secondary'}
                        disabled={page <= 1}
                        onClick={() => fetchPage(page - 1)}
                    >
                        ← Trước
                    </button>
                    <span className="pagination-current">
                        {page} / {meta.totalPages}
                    </span>
                    <button
                        type="button"
                        className={
                            page >= meta.totalPages
                                ? 'button-disabled'
                                : 'button-secondary'
                        }
                        disabled={page >= meta.totalPages}
                        onClick={() => fetchPage(page + 1)}
                    >
                        Sau →
                    </button>
                </div>
            ) : null}
        </div>
    );
}
