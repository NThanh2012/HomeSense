import { ReactNode } from 'react';
import { DashboardSidebar } from '../dashboard/DashboardSidebar';

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="dashboard-shell">
            <DashboardSidebar />
            <main className="dashboard-content">{children}</main>
        </div>
    );
}
