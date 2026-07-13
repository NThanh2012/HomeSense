import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import './globals.css';

export const metadata: Metadata = {
    title: {
        default: 'HomeSense — Hiểu nhu cầu, tìm đúng tổ ấm',
        template: '%s | HomeSense',
    },
    description: 'Nền tảng bất động sản nơi người bán tự đăng tin, admin kiểm duyệt và người mua tìm kiếm theo nhu cầu thực.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="vi">
            <body>
                <a className="skip-link" href="#main-content">
                    Chuyển đến nội dung chính
                </a>
                <div className="app-shell">
                    <Header />
                    <main id="main-content" className="app-main">{children}</main>
                    <Footer />
                </div>
            </body>
        </html>
    );
}
