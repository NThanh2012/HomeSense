interface AdminHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
}

export function AdminHeader({ eyebrow = 'Admin', title, description }: AdminHeaderProps) {
    return (
        <div className="admin-page-header">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {description ? <p className="page-description">{description}</p> : null}
        </div>
    );
}
