'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../../components/admin/AdminRequired';
import { ErrorState } from '../../../../../components/common/ErrorState';
import { Loading } from '../../../../../components/common/Loading';
import { getUserIntents, getUserPreferenceSignals, runUserLearning } from '../../../../../features/admin-learning/admin-learning.api';
import { PreferenceSignal, UserIntent } from '../../../../../features/admin-learning/admin-learning.types';

function Content({ token, userId }: { token: string; userId: string }) {
    const [intents, setIntents] = useState<UserIntent[]>([]);
    const [signals, setSignals] = useState<PreferenceSignal[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getUserIntents(userId, token), getUserPreferenceSignals(userId, token)])
            .then(([intentItems, signalItems]) => { setIntents(intentItems); setSignals(signalItems); })
            .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ nhu cầu.'))
            .finally(() => setLoading(false));
    }, [token, userId]);

    return <div className="admin-page">
        <AdminHeader title="Ý định người dùng" description={`Tín hiệu chuẩn hóa và các nhu cầu của người dùng ${userId}`} />
        <div className="admin-form-actions"><button className="button-primary" onClick={() => void runUserLearning(userId, token)}>Cập nhật ngay</button></div>
        {loading ? <Loading label="Đang tải nhu cầu..." /> : null}
        {error ? <ErrorState title="Không thể tải nhu cầu" message={error} /> : null}
        {!loading && !error ? <div className="admin-detail-grid">
            <section className="admin-detail-section"><h2>Nhu cầu</h2>{intents.map((intent) => <div className="admin-linked-card" key={intent.id}><strong>{intent.demandType} · {intent.propertyTypes.join(', ') || 'TẤT CẢ'}</strong><span>{intent.district ?? intent.province ?? 'Mọi khu vực'} · độ mạnh {intent.strength.toFixed(2)} · {intent.signalCount} tín hiệu</span></div>)}</section>
            <section className="admin-detail-section"><h2>Tín hiệu</h2>{signals.slice(0, 100).map((signal) => <div className="admin-linked-card" key={signal.id}><strong>{signal.signalType}</strong><span>{signal.source} · trọng số {signal.effectiveWeight.toFixed(2)}</span></div>)}</section>
        </div> : null}
    </div>;
}

export default function Page() {
    const params = useParams<{ id: string }>();
    return <AdminRequired>{({ token }) => <Content token={token} userId={params.id} />}</AdminRequired>;
}
