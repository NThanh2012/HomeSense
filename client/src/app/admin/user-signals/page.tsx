'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../components/admin/AdminRequired';
import { AdminUserSignalTable } from '../../../components/admin/user-signals/AdminUserSignalTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { getAdminUserSignals } from '../../../features/admin-user-signals/admin-user-signals.api';
import {
    AdminUserSignal,
    RawUserSignalStatus,
} from '../../../features/admin-user-signals/admin-user-signals.types';
import { PaginationMeta } from '../../../types/api-response.type';

const PAGE_LIMIT = 10;

function AdminUserSignalsContent({ token }: { token: string }) {
    const [items, setItems] = useState<AdminUserSignal[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState<RawUserSignalStatus | ''>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPage = (targetPage: number) => {
        setIsLoading(true);
        setError('');

        getAdminUserSignals(
            {
                page: targetPage,
                limit: PAGE_LIMIT,
                keyword: keyword.trim() || undefined,
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
                        : 'Không thể tải tín hiệu nhu cầu.',
                );
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, status]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        fetchPage(1);
    };

    return (
        <div className="admin-page">
            <AdminHeader
                title="User demand signals"
                description="Quản lý tín hiệu thô về nhu cầu mua, bán, thuê bất động sản của người dùng từ nguồn hợp lệ."
            />

            <form className="admin-filter-panel" onSubmit={handleSubmit}>
                <label>
                    <span>Từ khóa</span>
                    <input
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Nội dung, nguồn, external user"
                    />
                </label>
                <label>
                    <span>Trạng thái</span>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as RawUserSignalStatus | '')}
                    >
                        <option value="">Tất cả</option>
                        <option value="NEW">NEW</option>
                        <option value="ANALYZED">ANALYZED</option>
                        <option value="FAILED">FAILED</option>
                        <option value="INVALID">INVALID</option>
                    </select>
                </label>
                <button type="submit" className="button-primary">
                    Lọc
                </button>
                <Link href="/admin/user-signals/new" className="button-secondary">
                    Thêm tín hiệu
                </Link>
            </form>

            {isLoading ? <Loading label="Đang tải tín hiệu nhu cầu..." /> : null}
            {error ? <ErrorState title="Không thể tải tín hiệu" message={error} /> : null}
            {!isLoading && !error && items.length < 1 ? <EmptyState title="Không có tín hiệu nhu cầu" /> : null}
            {!isLoading && !error && items.length > 0 ? (
                <>
                    <div className="list-summary">
                        <p>
                            {meta?.total ?? 0} signals · Trang {page}/{meta?.totalPages ?? 1}
                        </p>
                    </div>
                    <AdminUserSignalTable items={items} />
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
                                className={page >= meta.totalPages ? 'button-disabled' : 'button-secondary'}
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

export default function AdminUserSignalsPage() {
    return (
        <AdminRequired>
            {({ token }) => <AdminUserSignalsContent token={token} />}
        </AdminRequired>
    );
}
