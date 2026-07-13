import Link from 'next/link';
import { FolderSearch } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description?: string;
    actionHref?: string;
    actionLabel?: string;
}

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
    return (
        <div className="state-box">
            <FolderSearch size={48} color="var(--text-light)" strokeWidth={1.5} />
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
            {actionHref && actionLabel ? (
                <Link href={actionHref} className="button-secondary">
                    {actionLabel}
                </Link>
            ) : null}
        </div>
    );
}
