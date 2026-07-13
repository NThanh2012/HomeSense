'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useCurrentUser } from '../../features/auth/use-current-user';
import { AuthUser } from '../../features/auth/auth.types';
import { Loading } from '../common/Loading';

interface AdminRequiredProps {
    children: (session: { user: AuthUser; token: string }) => ReactNode;
}

export function AdminRequired({ children }: AdminRequiredProps) {
    const { user, token, isLoading, error } = useCurrentUser();

    if (isLoading) {
        return <Loading label="Đang kiểm tra quyền admin..." />;
    }

    if (!user || !token) {
        return (
            <div className="auth-required-box">
                <p className="auth-required-msg">
                    {error ?? 'Vui lòng đăng nhập bằng tài khoản admin để tiếp tục.'}
                </p>
                <Link href="/auth/login" className="button-primary">
                    Đăng nhập
                </Link>
            </div>
        );
    }

    if (user.role !== 'ADMIN') {
        return (
            <div className="state-box state-box-error" role="alert">
                <h2>Không có quyền truy cập</h2>
                <p>Tài khoản hiện tại không phải admin.</p>
                <Link href="/properties" className="button-secondary">
                    Về trang bất động sản
                </Link>
            </div>
        );
    }

    return <>{children({ user, token })}</>;
}
