'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminDataSourceForm } from '../../../../components/admin/data-sources/AdminDataSourceForm';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { ErrorState } from '../../../../components/common/ErrorState';
import { Loading } from '../../../../components/common/Loading';
import {
    getAdminDataSource,
    updateAdminDataSource,
    updateAdminDataSourceStatus,
} from '../../../../features/admin-data-sources/admin-data-sources.api';
import { AdminDataSource } from '../../../../features/admin-data-sources/admin-data-sources.types';

function Content({ token, id }: { token: string; id: string }) {
    const [source, setSource] = useState<AdminDataSource | null>(null);
    const [error, setError] = useState('');

    const load = () => getAdminDataSource(id, token).then(setSource).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Không thể tải nguồn dữ liệu.'));
    useEffect(() => {
        void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, token]);

    if (!source && !error) return <Loading label="Đang tải nguồn dữ liệu..." />;
    if (!source) return <ErrorState title="Không thể tải nguồn dữ liệu" message={error} />;

    return (
        <div className="admin-page">
            <div className="back-row"><Link href="/admin/data-sources" className="text-link">Về danh sách nguồn</Link></div>
            <AdminHeader
                title={source.name}
                description={`${source.sourceType} · ${source.permissionType} · Không dùng để tạo tin bất động sản`}
            />
            {error ? <p className="form-error">{error}</p> : null}
            <div className="admin-form-actions">
                <button
                    type="button"
                    className={source.isActive ? 'button-secondary' : 'button-primary'}
                    onClick={async () => {
                        try {
                            await updateAdminDataSourceStatus(source.id, !source.isActive, token);
                            await load();
                        } catch (statusError) {
                            setError(statusError instanceof Error ? statusError.message : 'Không thể cập nhật trạng thái.');
                        }
                    }}
                >
                    {source.isActive ? 'Tắt nguồn' : 'Kích hoạt nguồn'}
                </button>
                <Link href={`/admin/source-imports/json`} className="button-secondary">Mở import JSON</Link>
            </div>
            <section className="admin-detail-section">
                <AdminDataSourceForm
                    lockSourceType
                    submitLabel="Lưu thay đổi"
                    initial={{
                        name: source.name,
                        sourceType: source.sourceType,
                        platform: source.platform ?? undefined,
                        baseUrl: source.baseUrl ?? undefined,
                        description: source.description ?? undefined,
                        permissionType: source.permissionType,
                        permissionNote: source.permissionNote,
                    }}
                    onSubmit={async ({ sourceType: _sourceType, ...payload }) => {
                        await updateAdminDataSource(source.id, payload, token);
                        await load();
                    }}
                />
            </section>
        </div>
    );
}

export default function Page() {
    const params = useParams<{ id: string }>();
    return <AdminRequired>{({ token }) => <Content token={token} id={params.id} />}</AdminRequired>;
}
