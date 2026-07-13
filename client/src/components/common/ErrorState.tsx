import Link from 'next/link';

interface ErrorStateProps {
    title: string;
    message: string;
    actionHref?: string;
    actionLabel?: string;
}

export function ErrorState({ title, message, actionHref, actionLabel }: ErrorStateProps) {
    return (
        <div className="state-box state-box-error" role="alert">
            <h2>{title}</h2>
            <p>{message}</p>
            {actionHref && actionLabel ? (
                <Link href={actionHref} className="button-secondary">
                    {actionLabel}
                </Link>
            ) : null}
        </div>
    );
}
