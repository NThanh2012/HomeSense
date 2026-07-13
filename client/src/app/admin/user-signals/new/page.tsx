'use client';

import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../../components/admin/AdminRequired';
import { AdminUserSignalForm } from '../../../../components/admin/user-signals/AdminUserSignalForm';

export default function NewAdminUserSignalPage() {
    return (
        <AdminRequired>
            {({ token }) => (
                <div className="admin-page">
                    <AdminHeader
                        title="Thêm tín hiệu nhu cầu"
                        description="Nhập thủ công dữ liệu nhu cầu từ nguồn hợp lệ. Không nhập dữ liệu riêng tư hoặc nhạy cảm ngoài phạm vi BĐS."
                    />
                    <AdminUserSignalForm token={token} />
                </div>
            )}
        </AdminRequired>
    );
}
