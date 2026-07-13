import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Điều khoản sử dụng',
    description: 'Các nguyên tắc sử dụng nền tảng HomeSense.',
};

export default function TermsPage() {
    return (
        <main className="page-shell legal-page">
            <Link href="/" className="text-link">← Về trang chủ</Link>
            <p className="eyebrow">Điều khoản</p>
            <h1>Một thị trường đáng tin bắt đầu từ thông tin trung thực.</h1>
            <p className="legal-intro">
                Khi sử dụng HomeSense, bạn đồng ý cung cấp thông tin đúng phạm vi, tôn trọng người dùng khác và chịu trách nhiệm với nội dung mình đăng tải.
            </p>

            <section className="legal-section">
                <h2>Đối với người bán</h2>
                <p>Người bán phải tự nhập đầy đủ thông tin bất động sản, sử dụng hình ảnh có quyền sử dụng và không đăng nội dung gây hiểu nhầm. Tin mới có thể được lưu nháp trước khi gửi duyệt.</p>
            </section>

            <section className="legal-section">
                <h2>Kiểm duyệt tin đăng</h2>
                <p>Admin có quyền yêu cầu bổ sung, từ chối hoặc ngừng công khai tin không đáp ứng quy tắc dữ liệu. Việc kiểm duyệt giúp tăng độ rõ ràng nhưng không thay thế quá trình xác minh pháp lý của người mua.</p>
            </section>

            <section className="legal-section">
                <h2>Đối với người mua</h2>
                <p>Thông tin và điểm gợi ý chỉ hỗ trợ tìm kiếm. Người mua cần chủ động kiểm tra hiện trạng, giấy tờ, giá và điều kiện giao dịch trước khi ra quyết định.</p>
            </section>

            <section className="legal-section">
                <h2>Sử dụng có trách nhiệm</h2>
                <p>Không sử dụng nền tảng để thu thập dữ liệu trái phép, giả mạo người khác, gửi nội dung rác hoặc can thiệp vào hoạt động bình thường của hệ thống.</p>
            </section>
        </main>
    );
}
