'use client';

import Link from 'next/link';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { AdminSourceImportJson } from '../../../../components/admin/source-imports/AdminSourceImportJson';

function Content({ token }: { token: string }) {
    return (
        <div className="admin-page">
            <div className="back-row"><Link href="/admin/source-imports" className="text-link">Về lịch sử import</Link></div>
            <AdminHeader
                title="Import JSON có kiểm soát"
                description="Chỉ nhập dữ liệu phục vụ học nhu cầu/hành vi; không tạo tin bất động sản."
            />
            <section className="admin-detail-section"><AdminSourceImportJson token={token} /></section>
        </div>
    );
}

export default function Page() {
    return <AdminRequired>{({ token }) => <Content token={token} />}</AdminRequired>;
}
