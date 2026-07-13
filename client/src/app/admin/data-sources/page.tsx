'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../components/admin/AdminRequired';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import {
    getAdminDataSources,
    updateAdminDataSourceStatus,
} from '../../../features/admin-data-sources/admin-data-sources.api';
import { AdminDataSource } from '../../../features/admin-data-sources/admin-data-sources.types';

function Content({ token }: { token: string }) {
    const [items, setItems] = useState<AdminDataSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const load = () => {
        setIsLoading(true);
        setError('');
        getAdminDataSources({ limit: 100 }, token)
            .then((result) => setItems(result.items))
            .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Không thể tải nguồn dữ liệu.'))
            .finally(() => setIsLoading(false));
    };

    useEffect(load, [token]);

    const toggle = async (source: AdminDataSource) => {
        setError('');
        try {
            await updateAdminDataSourceStatus(source.id, !source.isActive, token);
            load();
        } catch (toggleError) {
            setError(toggleError instanceof Error ? toggleError.message : 'Không thể cập nhật trạng thái.');
        }
    };

    return (
        <div className="admin-page">
            <AdminHeader
                title="Data sources"
                description="Nguồn này chỉ phục vụ học nhu cầu/hành vi và không được dùng để tạo tin bất động sản."
            />
            <div className="admin-form-actions">
                <Link href="/admin/data-sources/new" className="button-primary">Tạo nguồn dữ liệu</Link>
                <Link href="/admin/source-imports/json" className="button-secondary">Import JSON</Link>
            </div>
            {isLoading ? <Loading label="Đang tải nguồn dữ liệu..." /> : null}
            {error ? <ErrorState title="Không thể xử lý nguồn dữ liệu" message={error} /> : null}
            {!isLoading && !error && items.length < 1 ? <EmptyState title="Chưa có nguồn dữ liệu" /> : null}
            {!isLoading && items.length > 0 ? (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Nguồn</th><th>Loại</th><th>Permission</th><th>Batch</th><th>Trạng thái</th></tr></thead>
                        <tbody>
                            {items.map((source) => (
                                <tr key={source.id}>
                                    <td><Link className="admin-table-title" href={`/admin/data-sources/${source.id}`}>{source.name}</Link><span>{source.platform ?? source.baseUrl ?? 'Không có platform'}</span></td>
                                    <td>{source.sourceType}</td>
                                    <td>{source.permissionType}<span>{source.permissionNote}</span></td>
                                    <td>{source._count?.importBatches ?? 0}</td>
                                    <td><button type="button" className={source.isActive ? 'button-secondary' : 'button-primary'} onClick={() => toggle(source)}>{source.isActive ? 'Tắt nguồn' : 'Kích hoạt'}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}

export default function Page() {
    return <AdminRequired>{({ token }) => <Content token={token} />}</AdminRequired>;
}
