import { ReactNode } from 'react';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <div style={{ flex: 1 }}>
                {children}
            </div>
            <Footer />
        </div>
    );
}
