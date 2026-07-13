'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { ErrorState } from '../../../../components/common/ErrorState';
import { Loading } from '../../../../components/common/Loading';
import { getAdminSourceImport } from '../../../../features/admin-source-imports/admin-source-imports.api';
import { AdminSourceImportBatch } from '../../../../features/admin-source-imports/admin-source-imports.types';

function Content({ token, id }: { token: string; id: string }) {
    const [batch, setBatch] = useState<AdminSourceImportBatch | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getAdminSourceImport(id, token)
            .then(setBatch)
            .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Không thể tải batch import.'));
    }, [id, token]);

    if (!batch && !error) return <Loading label="Đang tải batch import..." />;
    if (!batch) return <ErrorState title="Không thể tải batch import" message={error} />;

    const getRawRecordHref = (targetType: string, rawRecordId: string) => {
        if (targetType === 'USER_SIGNAL') {
            return `/admin/user-signals/${rawRecordId}`;
        }

        if (targetType === 'EXTERNAL_BEHAVIOR') {
            return '/admin/external-behaviors';
        }

        return null;
    };

    return (
        <div className="admin-page">
            <div className="back-row"><Link href="/admin/source-imports" className="text-link">Về lịch sử import</Link></div>
            <AdminHeader title={`Batch ${batch.status}`} description={`${batch.dataSource.name} · ${batch.targetType}`} />
            <section className="admin-detail-section">
                <dl className="admin-info-list">
                    <div><dt>Permission</dt><dd>{batch.dataSource.permissionType}</dd></div>
                    <div><dt>Permission note</dt><dd>{batch.dataSource.permissionNote}</dd></div>
                    <div><dt>Total</dt><dd>{batch.totalRecords}</dd></div>
                    <div><dt>Kết quả</dt><dd>{batch.successCount} created · {batch.skippedCount} skipped · {batch.failedCount} failed</dd></div>
                </dl>
            </section>
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead><tr><th>#</th><th>External ID</th><th>Status</th><th>Raw record</th><th>Lỗi</th></tr></thead>
                    <tbody>{batch.records?.map((record) => {
                        const rawHref = record.rawRecordId
                            ? getRawRecordHref(batch.targetType, record.rawRecordId)
                            : null;
                        return (
                            <tr key={record.id}>
                                <td>{record.recordIndex + 1}</td>
                                <td>{record.externalId ?? '—'}</td>
                                <td>{record.status}</td>
                                <td>
                                    {record.rawRecordId && rawHref ? (
                                        <Link className="text-link" href={rawHref}>{record.rawRecordId}</Link>
                                    ) : (
                                        record.rawRecordId ?? '—'
                                    )}
                                </td>
                                <td>{record.errorMessage ?? '—'}</td>
                            </tr>
                        );
                    })}</tbody>
                </table>
            </div>
        </div>
    );
}

export default function Page() {
    const params = useParams<{ id: string }>();
    return <AdminRequired>{({ token }) => <Content token={token} id={params.id} />}</AdminRequired>;
}
