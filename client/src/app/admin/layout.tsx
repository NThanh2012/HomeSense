import { ReactNode } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface AdminRootLayoutProps {
    children: ReactNode;
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
    return (
        <div className="layout-standalone">
            <AdminLayout>{children}</AdminLayout>
        </div>
    );
}
