'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../components/admin/AdminRequired';
import { AdminPropertyTable } from '../../../components/admin/properties/AdminPropertyTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { getAdminProperties } from '../../../features/admin/admin.api';
import { Property, PropertyStatus } from '../../../features/properties/properties.types';
import { PaginationMeta } from '../../../types/api-response.type';

const PAGE_LIMIT = 10;

function AdminPropertiesContent({ token }: { token: string }) {
    const [items, setItems] = useState<Property[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState<PropertyStatus | ''>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPage = (targetPage: number) => {
        setIsLoading(true);
        setError('');

        getAdminProperties(
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
                        : 'Không thể tải danh sách bất động sản.',
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

    const handleUpdated = (property: Property) => {
        setItems((current) =>
            current.map((item) => (item.id === property.id ? property : item)),
        );
    };

    return (
        <div className="admin-page">
            <AdminHeader
                title="Quản lý bất động sản"
                description="Xem và cập nhật trạng thái tin đã chuẩn hóa."
            />

            <form className="admin-filter-panel" onSubmit={handleSubmit}>
                <label>
                    <span>Từ khóa</span>
                    <input
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Tiêu đề, mô tả, địa chỉ"
                    />
                </label>
                <label>
                    <span>Trạng thái</span>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as PropertyStatus | '')}
                    >
                        <option value="">Tất cả</option>
                        <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                </label>
                <button type="submit" className="button-primary">
                    Lọc
                </button>
            </form>

            {isLoading ? <Loading label="Đang tải bất động sản..." /> : null}
            {error ? <ErrorState title="Không thể tải danh sách" message={error} /> : null}
            {!isLoading && !error && items.length < 1 ? (
                <EmptyState title="Không có bất động sản" />
            ) : null}
            {!isLoading && !error && items.length > 0 ? (
                <>
                    <div className="list-summary">
                        <p>
                            {meta?.total ?? 0} tin · Trang {page}/{meta?.totalPages ?? 1}
                        </p>
                    </div>
                    <AdminPropertyTable items={items} token={token} onUpdated={handleUpdated} />
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

export default function AdminPropertiesPage() {
    return (
        <AdminRequired>
            {({ token }) => <AdminPropertiesContent token={token} />}
        </AdminRequired>
    );
}
