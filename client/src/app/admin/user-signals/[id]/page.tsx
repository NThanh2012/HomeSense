'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { AdminUserSignalDetail } from '../../../../components/admin/user-signals/AdminUserSignalDetail';
import { ErrorState } from '../../../../components/common/ErrorState';
import { Loading } from '../../../../components/common/Loading';
import {
    analyzeAdminUserSignal,
    getAdminUserSignalById,
} from '../../../../features/admin-user-signals/admin-user-signals.api';
import { AdminUserSignalDetail as AdminUserSignalDetailType } from '../../../../features/admin-user-signals/admin-user-signals.types';

function AdminUserSignalDetailContent({ token, id }: { token: string; id: string }) {
    const router = useRouter();
    const [detail, setDetail] = useState<AdminUserSignalDetailType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const fetchDetail = () => {
        setIsLoading(true);
        setError('');

        getAdminUserSignalById(id, token)
            .then(setDetail)
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải tín hiệu nhu cầu.',
                );
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, token]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError('');

        try {
            await analyzeAdminUserSignal(id, token);
            await getAdminUserSignalById(id, token).then(setDetail);
            router.refresh();
        } catch (analyzeError) {
            setError(
                analyzeError instanceof Error
                    ? analyzeError.message
                    : 'Không thể phân tích tín hiệu nhu cầu.',
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="admin-page">
            <AdminHeader
                title="Chi tiết tín hiệu nhu cầu"
                description="Xem raw signal, quyền sử dụng dữ liệu và kết quả phân tích nhu cầu BĐS."
            />

            {isLoading ? <Loading label="Đang tải tín hiệu nhu cầu..." /> : null}
            {error ? <ErrorState title="Có lỗi xảy ra" message={error} /> : null}
            {!isLoading && detail ? (
                <AdminUserSignalDetail
                    detail={detail}
                    isAnalyzing={isAnalyzing}
                    onAnalyze={handleAnalyze}
                />
            ) : null}
        </div>
    );
}

export default function AdminUserSignalDetailPage() {
    const params = useParams<{ id: string }>();

    return (
        <AdminRequired>
            {({ token }) => <AdminUserSignalDetailContent token={token} id={params.id} />}
        </AdminRequired>
    );
}
