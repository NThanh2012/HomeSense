'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AdminCreateUserSignalPayload,
    RawUserSignalConsentType,
} from '../../../features/admin-user-signals/admin-user-signals.types';
import { createAdminUserSignal } from '../../../features/admin-user-signals/admin-user-signals.api';

interface AdminUserSignalFormProps {
    token: string;
}

export function AdminUserSignalForm({ token }: AdminUserSignalFormProps) {
    const router = useRouter();
    const [form, setForm] = useState<AdminCreateUserSignalPayload>({
        sourceType: 'manual',
        sourceName: '',
        content: '',
        consentType: 'DEV_TEST',
    });
    const [metadataText, setMetadataText] = useState('{}');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = (key: keyof AdminCreateUserSignalPayload, value: string) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const metadata = metadataText.trim() ? JSON.parse(metadataText) : {};
            const result = await createAdminUserSignal(
                {
                    ...form,
                    metadata: metadata,
                },
                token,
            );

            router.push(`/admin/user-signals/${result.signal.id}`);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Không thể tạo tín hiệu nhu cầu.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="admin-form-grid" onSubmit={handleSubmit}>
            {error ? <p className="form-error admin-form-wide">{error}</p> : null}

            <label>
                <span>Loại nguồn</span>
                <input
                    value={form.sourceType}
                    onChange={(event) => updateField('sourceType', event.target.value)}
                    required
                />
            </label>

            <label>
                <span>Tên nguồn</span>
                <input
                    value={form.sourceName}
                    onChange={(event) => updateField('sourceName', event.target.value)}
                    required
                />
            </label>

            <label>
                <span>Source URL</span>
                <input
                    value={form.sourceUrl ?? ''}
                    onChange={(event) => updateField('sourceUrl', event.target.value)}
                />
            </label>

            <label>
                <span>External ID</span>
                <input
                    value={form.externalId ?? ''}
                    onChange={(event) => updateField('externalId', event.target.value)}
                />
            </label>

            <label>
                <span>External user ref</span>
                <input
                    value={form.externalUserRef ?? ''}
                    onChange={(event) => updateField('externalUserRef', event.target.value)}
                    placeholder="Reference hoặc hash nếu có"
                />
            </label>

            <label>
                <span>Quyền sử dụng dữ liệu</span>
                <select
                    value={form.consentType}
                    onChange={(event) =>
                        updateField('consentType', event.target.value as RawUserSignalConsentType)
                    }
                    required
                >
                    <option value="DEV_TEST">DEV_TEST</option>
                    <option value="PUBLIC_ALLOWED">PUBLIC_ALLOWED</option>
                    <option value="USER_PROVIDED">USER_PROVIDED</option>
                    <option value="AUTHORIZED_API">AUTHORIZED_API</option>
                    <option value="PARTNER">PARTNER</option>
                </select>
            </label>

            <label>
                <span>Tên tác giả</span>
                <input
                    value={form.authorName ?? ''}
                    onChange={(event) => updateField('authorName', event.target.value)}
                />
            </label>

            <label>
                <span>Số điện thoại</span>
                <input
                    value={form.authorPhone ?? ''}
                    onChange={(event) => updateField('authorPhone', event.target.value)}
                />
            </label>

            <label className="admin-form-wide">
                <span>Ghi chú quyền sử dụng</span>
                <input
                    value={form.permissionNote ?? ''}
                    onChange={(event) => updateField('permissionNote', event.target.value)}
                    placeholder="VD: Dữ liệu test/dev hoặc người dùng tự cung cấp"
                />
            </label>

            <label className="admin-form-wide">
                <span>Nội dung tín hiệu</span>
                <textarea
                    value={form.content}
                    onChange={(event) => updateField('content', event.target.value)}
                    required
                    rows={8}
                />
            </label>

            <label className="admin-form-wide">
                <span>Metadata JSON</span>
                <textarea
                    value={metadataText}
                    onChange={(event) => setMetadataText(event.target.value)}
                    rows={6}
                />
            </label>

            <div className="admin-form-actions">
                <button type="submit" className="button-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : 'Lưu tín hiệu'}
                </button>
            </div>
        </form>
    );
}
