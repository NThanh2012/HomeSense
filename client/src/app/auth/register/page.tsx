'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { register, setStoredToken } from '../../../features/auth/auth.api';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const session = await register({
                email: email,
                password: password,
                fullName: fullName || undefined,
                phone: phone || undefined,
            });

            setStoredToken(session.token);
            router.push('/');
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Không thể đăng ký. Vui lòng thử lại.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-shell">
            <section className="auth-card">
                <p className="eyebrow">HomeSense</p>
                <h1>Đăng ký</h1>
                <p>Tạo tài khoản để tự đăng tin bán, lưu nhà quan tâm và quản lý nhu cầu bất động sản của bạn.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                        />
                    </label>

                    <label>
                        <span>Mật khẩu</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            minLength={8}
                            maxLength={72}
                            autoComplete="new-password"
                            placeholder="Tối thiểu 8 ký tự"
                        />
                    </label>

                    <label>
                        <span>Họ tên</span>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            autoComplete="name"
                            placeholder="Nguyễn Văn A"
                        />
                    </label>

                    <label>
                        <span>Số điện thoại</span>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            autoComplete="tel"
                            placeholder="0901234567"
                        />
                    </label>

                    {error ? <p className="form-error">{error}</p> : null}

                    <button type="submit" className="button-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>

                <p className="auth-switch">
                    Đã có tài khoản? <Link href="/auth/login">Đăng nhập</Link>
                </p>
            </section>
        </main>
    );
}
