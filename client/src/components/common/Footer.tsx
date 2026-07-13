import Link from 'next/link';
import { ArrowUpRight, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="page-shell site-footer-grid">
                <div className="site-footer-brand">
                    <Link href="/" className="site-footer-logo">
                        <span className="site-logo-mark" aria-hidden="true">S</span>
                        <span>
                            <strong>HomeSense</strong>
                            <small>Nhà đất được kiểm duyệt</small>
                        </span>
                    </Link>
                    <p className="site-footer-desc">
                        Người bán tự đăng thông tin. Admin kiểm duyệt trước khi công khai. Người mua tìm nhà bằng dữ liệu rõ ràng và có nguồn chịu trách nhiệm.
                    </p>
                    <Link href="/dashboard/properties/new" className="site-footer-cta">
                        Đăng tin của bạn
                        <ArrowUpRight size={16} />
                    </Link>
                </div>

                <div>
                    <h3 className="site-footer-heading">Bắt đầu</h3>
                    <ul className="site-footer-links">
                        <li><Link href="/properties">Tất cả bất động sản</Link></li>
                        <li><Link href="/properties?transactionType=SELL">Nhà đất bán</Link></li>
                        <li><Link href="/properties?transactionType=RENT">Nhà đất cho thuê</Link></li>
                        <li><Link href="/dashboard/properties/new">Đăng tin mới</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="site-footer-heading">Liên hệ</h3>
                    <ul className="site-footer-contact">
                        <li>
                            <MapPin size={18} />
                            <span>Công viên phần mềm Quang Trung, Quận 12, TP.HCM</span>
                        </li>
                        <li>
                            <Phone size={18} />
                            <span>1900 1234</span>
                        </li>
                        <li>
                            <Mail size={18} />
                            <span>contact@homesense.vn</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="page-shell site-footer-bottom">
                <p>© {new Date().getFullYear()} HomeSense. Hiểu nhu cầu, tìm đúng tổ ấm.</p>
                <div className="site-footer-legal">
                    <Link href="/privacy">Chính sách bảo mật</Link>
                    <Link href="/terms">Điều khoản sử dụng</Link>
                </div>
            </div>
        </footer>
    );
}
