'use client';

import { FormEvent, useState } from 'react';
import {
    AdminDataSourcePayload,
    DataPermissionType,
    DataSourceType,
} from '../../../features/admin-data-sources/admin-data-sources.types';

interface Props {
    initial?: AdminDataSourcePayload;
    lockSourceType?: boolean;
    submitLabel: string;
    onSubmit: (payload: AdminDataSourcePayload) => Promise<void>;
}

const SOURCE_TYPES: DataSourceType[] = [
    'FACEBOOK',
    'WEBSITE',
    'PARTNER_API',
    'MANUAL_IMPORT',
    'USER_SUBMITTED',
    'PUBLIC_DATASET',
    'DEV_SYNTHETIC',
    'OTHER',
];

const PERMISSION_TYPES: DataPermissionType[] = [
    'AUTHORIZED_API',
    'PARTNER_AGREEMENT',
    'USER_SUBMITTED',
    'PUBLIC_ALLOWED',
    'DEV_SYNTHETIC',
    'UNKNOWN',
];

export function AdminDataSourceForm({ initial, lockSourceType, submitLabel, onSubmit }: Props) {
    const [form, setForm] = useState<AdminDataSourcePayload>(
        initial ?? {
            name: '',
            sourceType: 'PARTNER_API',
            permissionType: 'AUTHORIZED_API',
            permissionNote: '',
        },
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const update = (key: keyof AdminDataSourcePayload, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const updateSourceType = (sourceType: DataSourceType) => {
        setForm((current) => ({
            ...current,
            sourceType: sourceType,
            permissionType:
                sourceType === 'DEV_SYNTHETIC'
                    ? 'DEV_SYNTHETIC'
                    : current.permissionType === 'DEV_SYNTHETIC'
                      ? 'AUTHORIZED_API'
                      : current.permissionType,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await onSubmit({
                ...form,
                platform: form.platform?.trim() || undefined,
                baseUrl: form.baseUrl?.trim() || undefined,
                description: form.description?.trim() || undefined,
            });
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Không thể lưu nguồn dữ liệu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="admin-form-grid" onSubmit={handleSubmit}>
            <p className="note admin-form-wide">
                Dữ liệu hành vi gắn với tài khoản chỉ được dùng khi nguồn có API được cấp quyền,
                thỏa thuận đối tác hoặc do chính người dùng cung cấp. Nguồn này không bao giờ tạo tin bất động sản.
            </p>
            <label>
                <span>Tên nguồn</span>
                <input required value={form.name} onChange={(event) => update('name', event.target.value)} />
            </label>
            <label>
                <span>Loại nguồn</span>
                <select
                    value={form.sourceType}
                    disabled={lockSourceType}
                    onChange={(event) => updateSourceType(event.target.value as DataSourceType)}
                >
                    {SOURCE_TYPES.map((item) => <option key={item}>{item}</option>)}
                </select>
            </label>
            <label>
                <span>Nền tảng</span>
                <input value={form.platform ?? ''} onChange={(event) => update('platform', event.target.value)} />
            </label>
            <label>
                <span>Base URL</span>
                <input type="url" value={form.baseUrl ?? ''} onChange={(event) => update('baseUrl', event.target.value)} />
            </label>
            <label>
                <span>Quyền sử dụng</span>
                <select
                    value={form.permissionType}
                    onChange={(event) => update('permissionType', event.target.value)}
                >
                    {PERMISSION_TYPES.map((item) => <option key={item}>{item}</option>)}
                </select>
            </label>
            <label className="admin-form-wide">
                <span>Ghi chú quyền sử dụng</span>
                <textarea
                    required
                    rows={4}
                    value={form.permissionNote}
                    onChange={(event) => update('permissionNote', event.target.value)}
                />
            </label>
            <label className="admin-form-wide">
                <span>Mô tả</span>
                <textarea rows={4} value={form.description ?? ''} onChange={(event) => update('description', event.target.value)} />
            </label>
            {error ? <p className="form-error admin-form-wide">{error}</p> : null}
            <div className="admin-form-actions">
                <button type="submit" className="button-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
