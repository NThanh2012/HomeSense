'use client';

import { ChangeEvent, useState } from 'react';
import {
    AdminUserDemand,
    UserDemandStatus,
} from '../../../features/admin-user-demands/admin-user-demands.types';
import { updateAdminUserDemandStatus } from '../../../features/admin-user-demands/admin-user-demands.api';

interface AdminUserDemandStatusSelectProps {
    demand: AdminUserDemand;
    token: string;
    onUpdated: (demand: AdminUserDemand) => void;
}

const statuses: UserDemandStatus[] = ['NEW', 'ANALYZED', 'MATCHED', 'ARCHIVED', 'INVALID'];

export function AdminUserDemandStatusSelect({
    demand,
    token,
    onUpdated,
}: AdminUserDemandStatusSelectProps) {
    const [status, setStatus] = useState<UserDemandStatus>(demand.status);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
        const nextStatus = event.target.value as UserDemandStatus;
        setStatus(nextStatus);
        setIsSaving(true);
        setError('');

        try {
            const updated = await updateAdminUserDemandStatus(demand.id, { status: nextStatus }, token);
            onUpdated(updated);
        } catch (updateError) {
            setStatus(demand.status);
            setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật trạng thái.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="admin-status-editor">
            <label>
                <span>Trạng thái</span>
                <select value={status} onChange={handleChange} disabled={isSaving}>
                    {statuses.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </label>
            {error ? <p className="form-error">{error}</p> : null}
        </div>
    );
}
