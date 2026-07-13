'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminDataSourceForm } from '../../../../components/admin/data-sources/AdminDataSourceForm';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { createAdminDataSource } from '../../../../features/admin-data-sources/admin-data-sources.api';

function Content({ token }: { token: string }) {
    const router = useRouter();

    return (
        <div className="admin-page">
            <div className="back-row"><Link href="/admin/data-sources" className="text-link">Về danh sách nguồn</Link></div>
            <AdminHeader
                title="Tạo nguồn dữ liệu"
                description="Nguồn chỉ phục vụ học nhu cầu/hành vi, không tạo tin bất động sản; nguồn mới luôn inactive cho tới khi được duyệt."
            />
            <section className="admin-detail-section">
                <AdminDataSourceForm
                    submitLabel="Tạo nguồn"
                    onSubmit={async (payload) => {
                        const source = await createAdminDataSource(payload, token);
                        router.push(`/admin/data-sources/${source.id}`);
                    }}
                />
            </section>
        </div>
    );
}

export default function Page() {
    return <AdminRequired>{({ token }) => <Content token={token} />}</AdminRequired>;
}
