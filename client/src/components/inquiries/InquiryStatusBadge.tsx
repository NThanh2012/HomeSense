import { InquiryStatus } from '../../features/inquiries/inquiries.types';

interface InquiryStatusBadgeProps {
    status: InquiryStatus;
}

const STATUS_CONFIG: Record<
    InquiryStatus,
    { label: string; className: string }
> = {
    NEW: { label: 'Mới', className: 'badge-new' },
    CONTACTED: { label: 'Đã liên hệ', className: 'badge-contacted' },
    CLOSED: { label: 'Đã đóng', className: 'badge-closed' },
};

export function InquiryStatusBadge({ status }: InquiryStatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? {
        label: status,
        className: 'badge-closed',
    };

    return (
        <span className={`inquiry-badge ${config.className}`}>
            {config.label}
        </span>
    );
}
