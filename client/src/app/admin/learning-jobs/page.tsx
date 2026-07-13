'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../components/admin/AdminRequired';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { getLearningJobs } from '../../../features/admin-learning/admin-learning.api';
import { LearningJob } from '../../../features/admin-learning/admin-learning.types';
import { formatDate } from '../../../lib/format';

function Content({ token }: { token: string }) {
    const [items, setItems] = useState<LearningJob[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLearningJobs({ limit: 100 }, token)
            .then((result) => setItems(result.items))
            .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải tác vụ học.'))
            .finally(() => setLoading(false));
    }, [token]);

    return (
        <div className="admin-page">
            <AdminHeader title="Tác vụ học" description="Theo dõi xử lý nền cho việc học nhu cầu và tính lại gợi ý." />
            {loading ? <Loading label="Đang tải tác vụ học..." /> : null}
            {error ? <ErrorState title="Không thể tải tác vụ học" message={error} /> : null}
            {!loading && !error ? (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Tác vụ</th><th>Người dùng</th><th>Ưu tiên</th><th>Số lần chạy</th><th>Thời gian</th></tr></thead>
                        <tbody>{items.map((job) => (
                            <tr key={job.id}>
                                <td><Link className="admin-table-title" href={`/admin/learning-jobs/${job.id}`}>{job.type}</Link><span>{job.status}</span></td>
                                <td>{job.userId ?? '-'}</td>
                                <td>{job.priority}</td>
                                <td>{job.attempts}/{job.maxAttempts}</td>
                                <td>{formatDate(job.createdAt)}</td>
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
