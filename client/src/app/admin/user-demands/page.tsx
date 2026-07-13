'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../components/admin/AdminRequired';
import { AdminUserDemandTable } from '../../../components/admin/user-demands/AdminUserDemandTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { getAdminUserDemands } from '../../../features/admin-user-demands/admin-user-demands.api';
import {
    AdminUserDemand,
    DemandType,
    UserDemandStatus,
} from '../../../features/admin-user-demands/admin-user-demands.types';
import { PaginationMeta } from '../../../types/api-response.type';

const PAGE_LIMIT = 10;

function AdminUserDemandsContent({ token }: { token: string }) {
    const [items, setItems] = useState<AdminUserDemand[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [demandType, setDemandType] = useState<DemandType | ''>('');
    const [status, setStatus] = useState<UserDemandStatus | ''>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPage = (targetPage: number) => {
        setIsLoading(true);
        setError('');

        getAdminUserDemands(
            {
                page: targetPage,
                limit: PAGE_LIMIT,
                keyword: keyword.trim() || undefined,
                demandType: demandType || undefined,
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
                        : 'Không thể tải nhu cầu người dùng.',
                );
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, demandType, status]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        fetchPage(1);
    };

    return (
        <div className="admin-page">
            <AdminHeader
                title="User demands"
                description="Danh sách nhu cầu BĐS đã chuẩn hóa từ raw user signals."
            />

            <form className="admin-filter-panel" onSubmit={handleSubmit}>
                <label>
                    <span>Từ khóa</span>
                    <input
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Vị trí, external user, phone"
                    />
                </label>
                <label>
                    <span>Loại nhu cầu</span>
                    <select
                        value={demandType}
                        onChange={(event) => setDemandType(event.target.value as DemandType | '')}
                    >
                        <option value="">Tất cả</option>
                        <option value="BUY">BUY</option>
                        <option value="RENT">RENT</option>
                        <option value="SELL">SELL</option>
                        <option value="UNKNOWN">UNKNOWN</option>
                    </select>
                </label>
                <label>
                    <span>Trạng thái</span>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as UserDemandStatus | '')}
                    >
                        <option value="">Tất cả</option>
                        <option value="NEW">NEW</option>
                        <option value="ANALYZED">ANALYZED</option>
                        <option value="MATCHED">MATCHED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                        <option value="INVALID">INVALID</option>
                    </select>
                </label>
                <button type="submit" className="button-primary">
                    Lọc
                </button>
            </form>

            {isLoading ? <Loading label="Đang tải user demands..." /> : null}
            {error ? <ErrorState title="Không thể tải user demands" message={error} /> : null}
            {!isLoading && !error && items.length < 1 ? <EmptyState title="Không có user demand" /> : null}
            {!isLoading && !error && items.length > 0 ? (
                <>
                    <div className="list-summary">
                        <p>
                            {meta?.total ?? 0} demands · Trang {page}/{meta?.totalPages ?? 1}
                        </p>
                    </div>
                    <AdminUserDemandTable items={items} />
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

export default function AdminUserDemandsPage() {
    return (
        <AdminRequired>
            {({ token }) => <AdminUserDemandsContent token={token} />}
        </AdminRequired>
    );
}
