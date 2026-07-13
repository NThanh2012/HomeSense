'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, Plus, UserRound, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getStoredToken } from '../../features/auth/auth.api';

export function Header() {
    const [hasToken, setHasToken] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setHasToken(Boolean(getStoredToken()));
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <header className="site-header">
            <div className="site-header-inner page-shell">
                <Link href="/" className="site-logo">
                    <span className="site-logo-mark" aria-hidden="true">S</span>
                    <span className="site-logo-copy">
                        <strong>HomeSense</strong>
                        <small>Nhà đất được kiểm duyệt</small>
                    </span>
                </Link>

                <nav className="site-nav desktop-only">
                    <Link href="/" className={`site-nav-link ${pathname === '/' ? 'active' : ''}`}>
                        Trang chủ
                    </Link>
                    <Link href="/properties?transactionType=SELL" className="site-nav-link">
                        Mua bán
                    </Link>
                    <Link href="/properties?transactionType=RENT" className="site-nav-link">
                        Cho thuê
                    </Link>
                    <Link href="/properties" className={`site-nav-link ${pathname.startsWith('/properties') ? 'active' : ''}`}>
                        Tất cả BĐS
                    </Link>
                </nav>

                <div className="site-header-actions desktop-only">
                    {hasToken ? (
                        <>
                            <Link href="/dashboard" className="site-account-link">
                                <UserRound size={17} />
                                Tài khoản
                            </Link>
                            <Link href="/dashboard/properties/new" className="button-primary site-header-btn">
                                <Plus size={16} />
                                Đăng tin
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="site-nav-link">
                                Đăng nhập
                            </Link>
                            <Link href="/auth/register" className="button-primary site-header-btn">
                                Bắt đầu đăng tin
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="mobile-only site-header-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="site-mobile-navigation"
                >
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <nav id="site-mobile-navigation" className="mobile-only site-mobile-menu">
                    <Link href="/" className="site-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                        Trang chủ
                    </Link>
                    <Link href="/properties?transactionType=SELL" className="site-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                        Mua bán
                    </Link>
                    <Link href="/properties?transactionType=RENT" className="site-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                        Cho thuê
                    </Link>
                    <Link href="/properties" className="site-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                        Tất cả BĐS
                    </Link>
                    <hr className="site-mobile-divider" />
                    {hasToken ? (
                        <>
                            <Link href="/dashboard" className="button-secondary site-mobile-action" onClick={() => setIsMobileMenuOpen(false)}>
                                <UserRound size={17} />
                                Tài khoản
                            </Link>
                            <Link href="/dashboard/properties/new" className="button-primary site-mobile-action" onClick={() => setIsMobileMenuOpen(false)}>
                                <Plus size={17} />
                                Đăng tin mới
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="button-secondary site-mobile-action" onClick={() => setIsMobileMenuOpen(false)}>
                                Đăng nhập
                            </Link>
                            <Link href="/auth/register" className="button-primary site-mobile-action" onClick={() => setIsMobileMenuOpen(false)}>
                                Bắt đầu đăng tin
                            </Link>
                        </>
                    )}
                </nav>
            )}
        </header>
    );
}
