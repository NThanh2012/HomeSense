import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="admin-shell">
            <AdminSidebar />
            <main className="admin-content">{children}</main>
        </div>
    );
}
