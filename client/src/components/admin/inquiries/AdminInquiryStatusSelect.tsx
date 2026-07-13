'use client';

import { useState } from 'react';
import { updateAdminInquiryStatus } from '../../../features/admin/admin.api';
import { AdminInquiry } from '../../../features/admin/admin.types';
import { InquiryStatus } from '../../../features/inquiries/inquiries.types';

const INQUIRY_STATUSES: InquiryStatus[] = ['NEW', 'CONTACTED', 'CLOSED'];

interface AdminInquiryStatusSelectProps {
    inquiry: AdminInquiry;
    token: string;
    onUpdated: (inquiry: AdminInquiry) => void;
}

export function AdminInquiryStatusSelect({
    inquiry,
    token,
    onUpdated,
}: AdminInquiryStatusSelectProps) {
    const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = async (nextStatus: InquiryStatus) => {
        const previousStatus = status;
        setStatus(nextStatus);
        setIsSaving(true);
        setError('');

        try {
            const updated = await updateAdminInquiryStatus(inquiry.id, { status: nextStatus }, token);
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
                onChange={(event) => handleChange(event.target.value as InquiryStatus)}
                aria-label="Trạng thái yêu cầu tư vấn"
            >
                {INQUIRY_STATUSES.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
            {error ? <span className="form-error">{error}</span> : null}
        </div>
    );
}
