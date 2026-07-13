import Link from 'next/link';
import { AdminUserSignalDetail as AdminUserSignalDetailType } from '../../../features/admin-user-signals/admin-user-signals.types';
import { formatDate, formatPrice, formatArea } from '../../../lib/format';

interface AdminUserSignalDetailProps {
    detail: AdminUserSignalDetailType;
    isAnalyzing: boolean;
    onAnalyze: () => void;
}

export function AdminUserSignalDetail({
    detail,
    isAnalyzing,
    onAnalyze,
}: AdminUserSignalDetailProps) {
    const { signal, demand, analyses } = detail;
    const latestAnalysis = analyses[0];

    return (
        <div className="admin-detail-grid">
            <section className="admin-detail-section">
                <div className="admin-detail-heading">
                    <div>
                        <p className="eyebrow">{signal.status}</p>
                        <h2>{signal.sourceName}</h2>
                    </div>
                    <button
                        type="button"
                        className="button-primary"
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? 'Đang phân tích...' : 'Analyze nhu cầu'}
                    </button>
                </div>
                <dl className="admin-info-list">
                    <div>
                        <dt>Source type</dt>
                        <dd>{signal.sourceType}</dd>
                    </div>
                    <div>
                        <dt>Consent</dt>
                        <dd>{signal.consentType}</dd>
                    </div>
                    <div>
                        <dt>External user</dt>
                        <dd>{signal.externalUserRef ?? '—'}</dd>
                    </div>
                    <div>
                        <dt>Captured</dt>
                        <dd>{formatDate(signal.capturedAt)}</dd>
                    </div>
                </dl>
                <pre className="admin-raw-content">{signal.content}</pre>
            </section>

            <section className="admin-detail-section">
                <h2>Nguồn và governance</h2>
                <dl className="admin-info-list">
                    <div>
                        <dt>Source URL</dt>
                        <dd>{signal.sourceUrl ?? '—'}</dd>
                    </div>
                    <div>
                        <dt>External ID</dt>
                        <dd>{signal.externalId ?? '—'}</dd>
                    </div>
                    <div>
                        <dt>Tác giả</dt>
                        <dd>{[signal.authorName, signal.authorPhone].filter(Boolean).join(' · ') || '—'}</dd>
                    </div>
                    <div>
                        <dt>Permission note</dt>
                        <dd>{signal.permissionNote ?? '—'}</dd>
                    </div>
                    <div><dt>Data source</dt><dd>{signal.dataSourceId ?? '—'}</dd></div>
                    <div><dt>Import batch</dt><dd>{signal.sourceImportBatchId ?? '—'}</dd></div>
                    <div><dt>Permission type</dt><dd>{signal.permissionType ?? 'Legacy / chưa gắn'}</dd></div>
                    <div><dt>Ingested by</dt><dd>{signal.ingestedBy ?? '—'}</dd></div>
                </dl>
            </section>

            <section className="admin-detail-section">
                <h2>Nhu cầu chuẩn hóa</h2>
                {demand ? (
                    <dl className="admin-info-list">
                        <div>
                            <dt>Demand</dt>
                            <dd>
                                <Link href={`/admin/user-demands/${demand.id}`} className="text-link">
                                    {demand.demandType} · {demand.status}
                                </Link>
                            </dd>
                        </div>
                        <div>
                            <dt>Giá</dt>
                            <dd>{formatPrice(demand.minPrice)} - {formatPrice(demand.maxPrice)}</dd>
                        </div>
                        <div>
                            <dt>Diện tích</dt>
                            <dd>{formatArea(demand.minArea)} - {formatArea(demand.maxArea)}</dd>
                        </div>
                        <div>
                            <dt>Vị trí</dt>
                            <dd>{[demand.province, demand.district, demand.rawLocation].filter(Boolean).join(' · ') || '—'}</dd>
                        </div>
                    </dl>
                ) : (
                    <p className="admin-muted">Chưa có demand. Bấm analyze để tạo dữ liệu chuẩn hóa.</p>
                )}
            </section>

            <section className="admin-detail-section">
                <h2>Analysis gần nhất</h2>
                {latestAnalysis ? (
                    <pre className="admin-raw-content">
                        {JSON.stringify(latestAnalysis.result ?? latestAnalysis, null, 2)}
                    </pre>
                ) : (
                    <p className="admin-muted">Chưa có analysis.</p>
                )}
            </section>
        </div>
    );
}
