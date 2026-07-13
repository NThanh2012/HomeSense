'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { ErrorState } from '../../../../components/common/ErrorState';
import { Loading } from '../../../../components/common/Loading';
import { getLearningJob, retryLearningJob } from '../../../../features/admin-learning/admin-learning.api';
import { LearningJob } from '../../../../features/admin-learning/admin-learning.types';

function Content({ token, id }: { token: string; id: string }) {
    const [job, setJob] = useState<LearningJob | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getLearningJob(id, token).then(setJob).catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải tác vụ.'));
    }, [id, token]);

    if (!job && !error) return <Loading label="Đang tải tác vụ học..." />;
    if (!job) return <ErrorState title="Không thể tải tác vụ học" message={error} />;
    return (
        <div className="admin-page">
            <AdminHeader title={job.type} description={`Mã tác vụ ${job.id}`} />
            <section className="admin-detail-section">
                <dl className="admin-info-list">
                    <div><dt>Trạng thái</dt><dd>{job.status}</dd></div>
                    <div><dt>Người dùng</dt><dd>{job.userId ?? '-'}</dd></div>
                    <div><dt>Độ ưu tiên</dt><dd>{job.priority}</dd></div>
                    <div><dt>Lỗi gần nhất</dt><dd>{job.lastError ?? '-'}</dd></div>
                </dl>
            </section>
            {job.status === 'FAILED' ? <button className="button-primary" onClick={() => retryLearningJob(job.id, token).then(setJob)}>Chạy lại tác vụ</button> : null}
        </div>
    );
}

export default function Page() {
    const params = useParams<{ id: string }>();
    return <AdminRequired>{({ token }) => <Content token={token} id={params.id} />}</AdminRequired>;
}
