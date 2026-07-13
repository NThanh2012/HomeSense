'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../components/admin/AdminRequired';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { getAdminSourceImports } from '../../../features/admin-source-imports/admin-source-imports.api';
import { AdminSourceImportBatch } from '../../../features/admin-source-imports/admin-source-imports.types';
import { formatDate } from '../../../lib/format';

function Content({ token }: { token: string }) {
    const [items, setItems] = useState<AdminSourceImportBatch[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAdminSourceImports({ limit: 100 }, token)
            .then((result) => setItems(result.items))
            .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Không thể tải batch import.'))
            .finally(() => setIsLoading(false));
    }, [token]);

    return (
        <div className="admin-page">
            <AdminHeader
                title="Source imports"
                description="Import chỉ dành cho dữ liệu nhu cầu/hành vi; không tạo tin bất động sản."
            />
            <div className="admin-form-actions"><Link href="/admin/source-imports/json" className="button-primary">Import JSON</Link></div>
            {isLoading ? <Loading label="Đang tải batch import..." /> : null}
            {error ? <ErrorState title="Không thể tải batch import" message={error} /> : null}
            {!isLoading && !error && items.length < 1 ? <EmptyState title="Chưa có batch import" /> : null}
            {!isLoading && items.length > 0 ? (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Batch</th><th>Nguồn</th><th>Target</th><th>Kết quả</th><th>Thời gian</th></tr></thead>
                        <tbody>{items.map((batch) => (
                            <tr key={batch.id}>
                                <td><Link className="admin-table-title" href={`/admin/source-imports/${batch.id}`}>{batch.status}</Link><span>{batch.id}</span></td>
                                <td>{batch.dataSource.name}<span>{batch.dataSource.permissionType}</span></td>
                                <td>{batch.targetType}</td>
                                <td>{batch.successCount} created · {batch.skippedCount} skipped · {batch.failedCount} failed</td>
                                <td>{formatDate(batch.createdAt)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}

export default function Page() {
    return <AdminRequired>{({ token }) => <Content token={token} />}</AdminRequired>;
}
