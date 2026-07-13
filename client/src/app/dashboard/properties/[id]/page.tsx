'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthRequired } from '../../../../components/auth/AuthRequired';
import { ErrorState } from '../../../../components/common/ErrorState';
import { Loading } from '../../../../components/common/Loading';
import { PropertyListingForm } from '../../../../components/dashboard/PropertyListingForm';
import { useCurrentUser } from '../../../../features/auth/use-current-user';
import { getMyPropertyById } from '../../../../features/properties/properties.api';
import { Property } from '../../../../features/properties/properties.types';

function EditPropertyContent() {
    const params = useParams<{ id: string }>();
    const { token, isLoading: isAuthLoading } = useCurrentUser();
    const [property, setProperty] = useState<Property | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token || !params.id) {
            return;
        }

        setIsLoading(true);
        setError('');

        getMyPropertyById(params.id, token)
            .then((result) => setProperty(result))
            .catch((fetchError) => {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Không thể tải tin đăng.',
                );
            })
            .finally(() => setIsLoading(false));
    }, [params.id, token]);

    if (isAuthLoading || isLoading) {
        return <Loading label="Đang tải tin đăng..." />;
    }

    if (error) {
        return <ErrorState title="Không thể tải tin đăng" message={error} />;
    }

    if (!token || !property) {
        return null;
    }

    return (
        <div className="dashboard-page">
            <div className="back-row">
                <Link href="/dashboard/properties" className="text-link">
                    ← Quay lại tin đăng
                </Link>
            </div>

            <div className="dashboard-page-header">
                <p className="eyebrow">Tin đăng</p>
                <h1>Sửa tin đăng</h1>
                <p className="page-description">
                    Chỉnh sửa tin nháp hoặc tin chờ duyệt trước khi admin công khai.
                </p>
            </div>

            <PropertyListingForm token={token} property={property} />
        </div>
    );
}

export default function EditPropertyPage() {
    return (
        <AuthRequired>
            <EditPropertyContent />
        </AuthRequired>
    );
}
