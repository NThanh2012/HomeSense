import { CheckCircle } from 'lucide-react';

interface MatchReasonsListProps {
    reasons: string[];
}

export function MatchReasonsList({ reasons }: MatchReasonsListProps) {
    if (!reasons || reasons.length === 0) {
        return <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>Không có lý do</span>;
    }

    return (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {reasons.map((reason, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                    {reason}
                </li>
            ))}
        </ul>
    );
}
