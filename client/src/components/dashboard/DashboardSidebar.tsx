'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, User, Heart, MessageSquare, LogOut, ArrowLeft, Sparkles, Building2 } from 'lucide-react';
import { clearStoredToken, getStoredToken, logout } from '../../features/auth/auth.api';

const NAV_LINKS = [
    { href: '/dashboard', label: 'Tổng quan', exact: true, icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Hồ sơ cá nhân', exact: false, icon: User },
    { href: '/dashboard/favorites', label: 'Tin đã lưu', exact: false, icon: Heart },
    { href: '/dashboard/properties', label: 'Tin đăng của tôi', exact: false, icon: Building2 },
    { href: '/dashboard/inquiries', label: 'Yêu cầu liên hệ', exact: false, icon: MessageSquare },
    { href: '/dashboard/recommendations', label: 'Gợi ý BĐS', exact: false, icon: Sparkles },
];

export function DashboardSidebar() {
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
            // Fail-safe: xóa token dù API logout có lỗi
        } finally {
            clearStoredToken();
            router.push('/auth/login');
        }
    };

    return (
        <nav className="dashboard-sidebar">
            <div className="sidebar-brand">
                <Link href="/" className="sidebar-logo">
                    HomeSense
                </Link>
                <p className="sidebar-sub">Tài khoản</p>
            </div>

            <ul className="sidebar-nav">
                {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={
                                    isActive(link.href, link.exact)
                                        ? 'sidebar-link sidebar-link-active'
                                        : 'sidebar-link'
                                }
                                style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                            >
                                <Icon size={18} />
                                <span>{link.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="sidebar-footer">
                <Link href="/properties" className="sidebar-link" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <ArrowLeft size={18} />
                    <span>Về trang BĐS</span>
                </Link>
                <button
                    type="button"
                    className="sidebar-logout"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                >
                    <LogOut size={18} />
                    <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                </button>
            </div>
        </nav>
    );
}
