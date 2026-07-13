'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../components/admin/AdminRequired';
import { AdminInquiryTable } from '../../../components/admin/inquiries/AdminInquiryTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { getAdminInquiries } from '../../../features/admin/admin.api';
import { AdminInquiry } from '../../../features/admin/admin.types';
import { InquiryStatus } from '../../../features/inquiries/inquiries.types';
import { PaginationMeta } from '../../../types/api-response.type';

const PAGE_LIMIT = 10;

function AdminInquiriesContent({ token }: { token: string }) {
    const [items, setItems] = useState<AdminInquiry[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<InquiryStatus | ''>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPage = (targetPage: number) => {
        setIsLoading(true);
        setError('');

        getAdminInquiries(
            {
                page: targetPage,
                limit: PAGE_LIMIT,
                status: status || undefined,
            },
            token,
        )
            .then((result) => {
                setItems(result.items);
                setMeta(result.meta);
                setPage(targetPage);
            })
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải inquiries.',
                );
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, status]);

    const handleUpdated = (inquiry: AdminInquiry) => {
        setItems((current) =>
            current.map((item) => (item.id === inquiry.id ? inquiry : item)),
        );
    };

    return (
        <div className="admin-page">
            <AdminHeader
                title="Yêu cầu tư vấn"
                description="Xem và cập nhật trạng thái inquiry của người dùng."
            />

            <div className="admin-filter-panel">
                <label>
                    <span>Trạng thái</span>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as InquiryStatus | '')}
                    >
                        <option value="">Tất cả</option>
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="CLOSED">CLOSED</option>
                    </select>
                </label>
            </div>

            {isLoading ? <Loading label="Đang tải inquiries..." /> : null}
            {error ? <ErrorState title="Không thể tải inquiries" message={error} /> : null}
            {!isLoading && !error && items.length < 1 ? <EmptyState title="Không có inquiry" /> : null}
            {!isLoading && !error && items.length > 0 ? (
                <>
                    <div className="list-summary">
                        <p>
                            {meta?.total ?? 0} inquiries · Trang {page}/{meta?.totalPages ?? 1}
                        </p>
                    </div>
                    <AdminInquiryTable items={items} token={token} onUpdated={handleUpdated} />
                    {meta && meta.totalPages > 1 ? (
                        <div className="pagination">
                            <button
                                type="button"
                                className={page <= 1 ? 'button-disabled' : 'button-secondary'}
                                disabled={page <= 1}
                                onClick={() => fetchPage(page - 1)}
                            >
                                Trước
                            </button>
                            <span className="pagination-current">
                                {page} / {meta.totalPages}
                            </span>
                            <button
                                type="button"
                                className={
                                    page >= meta.totalPages ? 'button-disabled' : 'button-secondary'
                                }
                                disabled={page >= meta.totalPages}
                                onClick={() => fetchPage(page + 1)}
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

export default function AdminInquiriesPage() {
    return (
        <AdminRequired>
            {({ token }) => <AdminInquiriesContent token={token} />}
        </AdminRequired>
    );
}
