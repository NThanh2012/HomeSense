'use client';

import { useState } from 'react';
import { updateAdminPropertyStatus } from '../../../features/admin/admin.api';
import { Property, PropertyStatus } from '../../../features/properties/properties.types';

const ALLOWED_STATUS_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
    DRAFT: ['DRAFT', 'ARCHIVED'],
    PENDING_REVIEW: ['PENDING_REVIEW', 'DRAFT', 'PUBLISHED', 'ARCHIVED'],
    PUBLISHED: ['PUBLISHED', 'ARCHIVED'],
    ARCHIVED: ['ARCHIVED'],
};

interface AdminPropertyStatusSelectProps {
    property: Property;
    token: string;
    onUpdated: (property: Property) => void;
}

export function AdminPropertyStatusSelect({
    property,
    token,
    onUpdated,
}: AdminPropertyStatusSelectProps) {
    const [status, setStatus] = useState<PropertyStatus>(property.status);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = async (nextStatus: PropertyStatus) => {
        const previousStatus = status;
        setStatus(nextStatus);
        setIsSaving(true);
        setError('');

        try {
            const updated = await updateAdminPropertyStatus(property.id, { status: nextStatus }, token);
            onUpdated(updated);
        } catch (updateError) {
            setStatus(previousStatus);
            setError(
                updateError instanceof Error
                    ? updateError.message
                    : 'Không thể cập nhật trạng thái.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="admin-status-control">
            <select
                value={status}
                disabled={isSaving}
                onChange={(event) => handleChange(event.target.value as PropertyStatus)}
                aria-label="Trạng thái bất động sản"
            >
                {ALLOWED_STATUS_TRANSITIONS[property.status].map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
            {error ? <span className="form-error">{error}</span> : null}
        </div>
    );
}
