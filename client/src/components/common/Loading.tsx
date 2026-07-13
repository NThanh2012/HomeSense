interface LoadingProps {
    label?: string;
}

export function Loading({ label = 'Đang tải dữ liệu...' }: LoadingProps) {
    return (
        <div className="state-box" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <p>{label}</p>
        </div>
    );
}
