'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getStoredToken } from '../../features/auth/auth.api';
import { createInquiry } from '../../features/inquiries/inquiries.api';
import { trackUserBehavior } from '../../features/user-behaviors/user-behaviors.api';

interface PropertyInquiryFormProps {
    propertyId: string;
}

export function PropertyInquiryForm({ propertyId }: PropertyInquiryFormProps) {
    const [token, setToken] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setToken(getStoredToken());
    }, []);

    if (!token) {
        return null;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            await createInquiry(
                {
                    propertyId: propertyId,
                    message: message,
                    contactName: contactName || undefined,
                    contactPhone: contactPhone || undefined,
                },
                token,
            );
            trackUserBehavior({
                eventType: 'INQUIRY_CREATED',
                propertyId: propertyId,
                metadata: {
                    hasContactName: Boolean(contactName),
                    hasContactPhone: Boolean(contactPhone),
                },
            });

            setMessage('');
            setContactName('');
            setContactPhone('');
            setSuccess('Đã gửi yêu cầu tư vấn.');
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Không thể gửi yêu cầu tư vấn.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="inquiry-form" onSubmit={handleSubmit}>
            <h3>Gửi yêu cầu tư vấn</h3>
            <label>
                <span>Nội dung yêu cầu</span>
                <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                    maxLength={1000}
                    placeholder="Tôi muốn được tư vấn thêm về bất động sản này..."
                />
            </label>

            <label>
                <span>Tên liên hệ</span>
                <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Nguyễn Văn A"
                />
            </label>

            <label>
                <span>Số điện thoại</span>
                <input
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    placeholder="0901234567"
                />
            </label>

            {success ? <p className="form-success">{success}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="button-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
        </form>
    );
}
