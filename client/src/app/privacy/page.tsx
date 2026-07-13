import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Chính sách bảo mật',
    description: 'Nguyên tắc thu thập, sử dụng và bảo vệ dữ liệu tại HomeSense.',
};

export default function PrivacyPage() {
    return (
        <main className="page-shell legal-page">
            <Link href="/" className="text-link">← Về trang chủ</Link>
            <p className="eyebrow">Quyền riêng tư</p>
            <h1>Dữ liệu rõ ràng, quyền kiểm soát thuộc về bạn.</h1>
            <p className="legal-intro">
                HomeSense chỉ sử dụng thông tin cần thiết để vận hành tài khoản, tin đăng và các gợi ý bất động sản. Nội dung dưới đây mô tả ngắn gọn cách hệ thống xử lý dữ liệu.
            </p>

            <section className="legal-section">
                <h2>Thông tin được lưu</h2>
                <p>Hệ thống lưu thông tin tài khoản, dữ liệu tin đăng do người bán tự nhập, nhu cầu bất động sản và các tương tác cần thiết để cung cấp chức năng đã chọn.</p>
            </section>

            <section className="legal-section">
                <h2>Mục đích sử dụng</h2>
                <p>Dữ liệu được dùng để quản lý tài khoản, kiểm duyệt tin đăng, hỗ trợ liên hệ và cải thiện thứ tự gợi ý. Hệ thống không dùng dữ liệu này để suy luận đặc điểm nhạy cảm.</p>
            </section>

            <section className="legal-section">
                <h2>Nguồn dữ liệu</h2>
                <p>Tin bất động sản công khai trên website được tạo từ biểu mẫu có cấu trúc do người bán đã đăng nhập tự nhập và chỉ hiển thị sau khi admin kiểm duyệt.</p>
            </section>

            <section className="legal-section">
                <h2>Liên hệ</h2>
                <p>Nếu cần xem xét hoặc điều chỉnh dữ liệu tài khoản, bạn có thể liên hệ qua email contact@homesense.vn.</p>
            </section>
        </main>
    );
}
