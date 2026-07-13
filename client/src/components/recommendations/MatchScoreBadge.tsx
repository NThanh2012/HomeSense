interface MatchScoreBadgeProps {
    score: number;
}

export function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
    const color =
        score >= 70 ? '#16a34a' :
        score >= 40 ? '#d97706' :
        '#e11d48';
    const background =
        score >= 70 ? '#dcfce7' :
        score >= 40 ? '#fef3c7' :
        '#ffe4e6';

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '52px',
            padding: '4px 10px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '14px',
            color,
            background,
        }}>
            {score.toFixed(0)}đ
        </span>
    );
}
