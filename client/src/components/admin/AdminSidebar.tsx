'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { clearStoredToken, getStoredToken, logout } from '../../features/auth/auth.api';

const NAV_LINKS = [
    { href: '/admin', label: 'Tổng quan', exact: true },
    { href: '/admin/properties', label: 'Bất động sản', exact: false },
    { href: '/admin/data-sources', label: 'Nguồn dữ liệu', exact: false },
    { href: '/admin/source-imports', label: 'Lịch sử nhập', exact: false },
    { href: '/admin/learning-jobs', label: 'Tác vụ học', exact: false },
    { href: '/admin/external-behaviors', label: 'Hành vi bên ngoài', exact: false },
    { href: '/admin/user-signals', label: 'Tín hiệu nhu cầu', exact: false },
    { href: '/admin/user-demands', label: 'Nhu cầu người dùng', exact: false },
    { href: '/admin/inquiries', label: 'Yêu cầu tư vấn', exact: false },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isActive = (href: string, exact: boolean) => {
        if (exact) {
            return pathname === href;
        }

        return pathname.startsWith(href);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        const token = getStoredToken();

        try {
            if (token) {
                await logout(token);
            }
        } catch {
            // Xóa token local dù API logout lỗi để tránh kẹt phiên local.
        } finally {
            clearStoredToken();
            router.push('/auth/login');
        }
    };

    return (
        <nav className="admin-sidebar">
            <div className="sidebar-brand">
                <Link href="/admin" className="sidebar-logo">
                    HomeSense
                </Link>
                <p className="sidebar-sub">Admin</p>
            </div>

            <ul className="sidebar-nav">
                {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            className={
                                isActive(link.href, link.exact)
                                    ? 'sidebar-link sidebar-link-active'
                                    : 'sidebar-link'
                            }
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <Link href="/dashboard" className="sidebar-link">
                    Tài khoản
                </Link>
                <Link href="/properties" className="sidebar-link">
                    Trang BĐS
                </Link>
                <button
                    type="button"
                    className="sidebar-logout"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                </button>
            </div>
        </nav>
    );
}
