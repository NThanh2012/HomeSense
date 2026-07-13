'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { login, setStoredToken } from '../../../features/auth/auth.api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const session = await login({
                email: email,
                password: password,
            });

            setStoredToken(session.token);
            router.push('/');
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Không thể đăng nhập. Vui lòng thử lại.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-shell">
            <section className="auth-card">
                <p className="eyebrow">HomeSense</p>
                <h1>Đăng nhập</h1>
                <p>Quản lý tin đăng, lưu bất động sản quan tâm và nhận gợi ý phù hợp với nhu cầu của bạn.</p>

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
                            autoComplete="current-password"
                            placeholder="Tối thiểu 8 ký tự"
                        />
                    </label>

                    {error ? <p className="form-error">{error}</p> : null}

                    <button type="submit" className="button-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <p className="auth-switch">
                    Chưa có tài khoản? <Link href="/auth/register">Đăng ký</Link>
                </p>
            </section>
        </main>
    );
}
