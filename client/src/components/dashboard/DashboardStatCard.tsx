import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface DashboardStatCardProps {
    label: string;
    value: number | string | null;
    href: string;
    actionLabel: string;
    icon?: LucideIcon;
}

export function DashboardStatCard({
    label,
    value,
    href,
    actionLabel,
    icon: Icon,
}: DashboardStatCardProps) {
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p className="stat-card-label">{label}</p>
                {Icon && <Icon size={24} color="var(--primary)" style={{ opacity: 0.5 }} />}
            </div>
            <strong className="stat-card-value">
                {value === null ? '—' : value}
            </strong>
            <Link href={href} className="stat-card-link">
                {actionLabel} →
            </Link>
        </div>
    );
}
