import Link from 'next/link';

interface AdminStatCardProps {
    label: string;
    value: number | string | null;
    href?: string;
    actionLabel?: string;
}

export function AdminStatCard({ label, value, href, actionLabel }: AdminStatCardProps) {
    return (
        <article className="admin-stat-card">
            <p>{label}</p>
            <strong>{value ?? '—'}</strong>
            {href && actionLabel ? (
                <Link href={href} className="text-link">
                    {actionLabel}
                </Link>
            ) : null}
        </article>
    );
}
