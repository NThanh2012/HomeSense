'use client';

import { useEffect, useState } from 'react';
import { getFavorites } from '../../features/favorites/favorites.api';
import { FavoriteListItem } from '../../features/favorites/favorites.types';
import { PaginationMeta } from '../../types/api-response.type';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { Loading } from '../common/Loading';
import { FavoritePropertyCard } from './FavoritePropertyCard';

interface FavoritePropertyListProps {
    token: string;
}

const PAGE_LIMIT = 9;

export function FavoritePropertyList({ token }: FavoritePropertyListProps) {
    const [items, setItems] = useState<FavoriteListItem[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPage = (targetPage: number) => {
        setIsLoading(true);
        setError('');

        getFavorites({ page: targetPage, limit: PAGE_LIMIT }, token)
            .then((result) => {
                setItems(result.items);
                setMeta(result.meta);
                setPage(targetPage);
            })
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải danh sách đã lưu.',
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

    const handleRemoved = (propertyId: string) => {
        const remaining = items.filter((item) => item.propertyId !== propertyId);
        setItems(remaining);

        if (meta) {
            const newTotal = meta.total - 1;
            const newTotalPages = Math.ceil(newTotal / PAGE_LIMIT) || 1;
            setMeta({ ...meta, total: newTotal, totalPages: newTotalPages });

            // Nếu trang hiện tại rỗng sau khi bỏ lưu và còn trang trước, lùi 1 trang
            if (remaining.length === 0 && page > 1) {
                fetchPage(page - 1);
            }
        }
    };

    if (isLoading) {
        return <Loading label="Đang tải tin đã lưu..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Không thể tải danh sách"
                message={error}
                actionHref="/dashboard/favorites"
                actionLabel="Thử lại"
            />
        );
    }

    if (items.length < 1) {
        return (
            <EmptyState
                title="Chưa có tin đã lưu"
                description="Bạn chưa lưu bất động sản nào. Hãy duyệt danh sách và lưu tin yêu thích."
                actionHref="/properties"
                actionLabel="Xem bất động sản"
            />
        );
    }

    return (
        <div className="list-section">
            <div className="list-summary">
                <p>
                    {meta?.total ?? 0} tin đã lưu · Trang {page}/{meta?.totalPages ?? 1}
                </p>
            </div>

            <div className="fav-grid">
                {items.map((item) => (
                    <FavoritePropertyCard
                        key={item.id}
                        item={item}
                        token={token}
                        onRemoved={handleRemoved}
                    />
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
