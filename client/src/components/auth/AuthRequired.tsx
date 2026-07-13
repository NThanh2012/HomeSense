'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useCurrentUser } from '../../features/auth/use-current-user';
import { Loading } from '../common/Loading';

interface AuthRequiredProps {
    children: ReactNode;
}

export function AuthRequired({ children }: AuthRequiredProps) {
    const { user, isLoading, error } = useCurrentUser();

    if (isLoading) {
        return <Loading label="Đang kiểm tra đăng nhập..." />;
    }

    if (!user) {
        return (
            <div className="auth-required-box">
                <p className="auth-required-msg">
                    {error ?? 'Vui lòng đăng nhập để tiếp tục.'}
                </p>
                <Link href="/auth/login" className="button-primary">
                    Đăng nhập
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
