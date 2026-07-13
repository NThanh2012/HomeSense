'use client';

import { FormEvent, useEffect, useState } from 'react';
import { updateMe } from '../../features/auth/auth.api';
import { AuthUser } from '../../features/auth/auth.types';

interface ProfileFormProps {
    user: AuthUser;
    token: string;
}

const roleLabels: Record<string, string> = {
    USER: 'Người dùng',
    ADMIN: 'Quản trị viên',
};

const statusLabels: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    BLOCKED: 'Bị chặn',
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
    }).format(new Date(value));

export function ProfileForm({ user, token }: ProfileFormProps) {
    const [fullName, setFullName] = useState(user.fullName ?? '');
    const [phone, setPhone] = useState(user.phone ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Đồng bộ lại khi user prop thay đổi
    useEffect(() => {
        setFullName(user.fullName ?? '');
        setPhone(user.phone ?? '');
    }, [user]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccess('');
        setError('');
        setIsSubmitting(true);

        try {
            await updateMe(
                {
                    fullName: fullName.trim() || undefined,
                    phone: phone.trim() || undefined,
                },
                token,
            );
            setSuccess('Đã cập nhật thông tin thành công.');
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Không thể cập nhật thông tin. Vui lòng thử lại.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="profile-wrap">
            <section className="profile-section">
                <h2>Thông tin chỉ đọc</h2>
                <dl className="detail-list">
                    <div>
                        <dt>Email</dt>
                        <dd>{user.email}</dd>
                    </div>
                    <div>
                        <dt>Vai trò</dt>
                        <dd>{roleLabels[user.role] ?? user.role}</dd>
                    </div>
                    <div>
                        <dt>Trạng thái</dt>
                        <dd>{statusLabels[user.status] ?? user.status}</dd>
                    </div>
                    <div>
                        <dt>Ngày tạo</dt>
                        <dd>{formatDate(user.createdAt)}</dd>
                    </div>
                </dl>
            </section>

            <section className="profile-section">
                <h2>Cập nhật thông tin</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Họ và tên</span>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Nguyễn Văn A"
                        />
                    </label>

                    <label>
                        <span>Số điện thoại</span>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="0901234567"
                        />
                    </label>

                    {success ? <p className="form-success">{success}</p> : null}
                    {error ? <p className="form-error">{error}</p> : null}

                    <button
                        type="submit"
                        className="button-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </form>
            </section>
        </div>
    );
}
