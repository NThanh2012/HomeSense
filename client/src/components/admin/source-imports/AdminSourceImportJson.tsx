'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getAdminDataSources } from '../../../features/admin-data-sources/admin-data-sources.api';
import { AdminDataSource } from '../../../features/admin-data-sources/admin-data-sources.types';
import { importAdminSourceJson } from '../../../features/admin-source-imports/admin-source-imports.api';
import {
    AdminSourceImportBatch,
    SourceImportTargetType,
} from '../../../features/admin-source-imports/admin-source-imports.types';

interface Props {
    token: string;
}

const samples: Record<SourceImportTargetType, Record<string, unknown>[]> = {
    USER_SIGNAL: [
        {
            externalId: 'phase13-signal-001',
            externalUserRef: 'synthetic-user-001',
            sourceUrl: 'https://example.test/signal/phase13-001',
            content: 'Cần thuê căn hộ synthetic tại Quận 7, ngân sách 12 triệu.',
            capturedAt: '2026-06-06T00:00:00.000Z',
            metadata: { synthetic: true },
        },
    ],
    EXTERNAL_BEHAVIOR: [
        {
            externalId: 'phase18-behavior-001',
            externalUserRef: 'synthetic-user-001',
            occurredAt: '2026-06-12T00:00:00.000Z',
            payload: {
                eventType: 'SEARCH',
                transactionType: 'RENT',
                propertyType: 'APARTMENT',
                district: 'Cau Giay',
                maxPrice: 15000000,
            },
        },
    ],
};

export function AdminSourceImportJson({ token }: Props) {
    const [sources, setSources] = useState<AdminDataSource[]>([]);
    const [dataSourceId, setDataSourceId] = useState('');
    const [targetType, setTargetType] = useState<SourceImportTargetType>('USER_SIGNAL');
    const [jsonText, setJsonText] = useState(JSON.stringify(samples.USER_SIGNAL, null, 2));
    const [result, setResult] = useState<AdminSourceImportBatch | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        getAdminDataSources({ limit: 100, isActive: true }, token)
            .then((response) => {
                setSources(response.items);
                setDataSourceId(response.items[0]?.id ?? '');
            })
            .catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : 'Không thể tải nguồn dữ liệu.');
            });
    }, [token]);

    const preview = useMemo(() => {
        try {
            const parsed = JSON.parse(jsonText) as unknown;
            if (!Array.isArray(parsed)) throw new Error('JSON import phải là một mảng.');
            if (parsed.length < 1 || parsed.length > 50) throw new Error('Số record phải từ 1 đến 50.');
            return { items: parsed as Record<string, unknown>[], error: '' };
        } catch (parseError) {
            return {
                items: [] as Record<string, unknown>[],
                error: parseError instanceof Error ? parseError.message : 'JSON không hợp lệ.',
            };
        }
    }, [jsonText]);

    const changeTarget = (value: SourceImportTargetType) => {
        setTargetType(value);
        setJsonText(JSON.stringify(samples[value], null, 2));
        setResult(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');
        setResult(null);

        try {
            const response = await importAdminSourceJson(
                { dataSourceId, targetType, items: preview.items },
                token,
            );
            setResult(response);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Không thể import JSON.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="admin-import-panel" onSubmit={handleSubmit}>
            <p className="note">
                Import này chỉ phục vụ phân tích nhu cầu và hành vi người dùng, không tạo tin bất động sản.
                Chỉ dùng dữ liệu được phép sử dụng; không nhập credential hoặc PII không cần thiết.
            </p>
            <label>
                <span>Nguồn dữ liệu đang hoạt động</span>
                <select required value={dataSourceId} onChange={(event) => setDataSourceId(event.target.value)}>
                    {sources.length < 1 ? <option value="">Chưa có nguồn hợp lệ</option> : null}
                    {sources.map((source) => (
                        <option key={source.id} value={source.id}>
                            {source.name} · {source.permissionType}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                <span>Target</span>
                <select value={targetType} onChange={(event) => changeTarget(event.target.value as SourceImportTargetType)}>
                    <option value="USER_SIGNAL">USER_SIGNAL</option>
                    <option value="EXTERNAL_BEHAVIOR">EXTERNAL_BEHAVIOR</option>
                </select>
            </label>
            <label>
                <span>JSON records</span>
                <textarea rows={18} value={jsonText} onChange={(event) => setJsonText(event.target.value)} />
            </label>
            <div className={preview.error ? 'form-error' : 'form-success'}>
                {preview.error || `Sẵn sàng import ${preview.items.length} record(s).`}
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="admin-form-actions">
                <button
                    type="submit"
                    className="button-primary"
                    disabled={isSubmitting || Boolean(preview.error) || !dataSourceId}
                >
                    {isSubmitting ? 'Đang import...' : 'Import có kiểm soát'}
                </button>
            </div>
            {result ? (
                <section className="admin-detail-section">
                    <h2>Kết quả batch</h2>
                    <p>
                        Created: {result.successCount} · Skipped: {result.skippedCount} · Failed: {result.failedCount}
                    </p>
                    <Link href={`/admin/source-imports/${result.id}`} className="text-link">
                        Xem batch audit
                    </Link>
                </section>
            ) : null}
        </form>
    );
}
