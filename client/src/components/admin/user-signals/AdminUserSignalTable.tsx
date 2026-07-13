import Link from 'next/link';
import { AdminUserSignal } from '../../../features/admin-user-signals/admin-user-signals.types';
import { formatDate } from '../../../lib/format';

interface AdminUserSignalTableProps {
    items: AdminUserSignal[];
}

export function AdminUserSignalTable({ items }: AdminUserSignalTableProps) {
    return (
        <div className="admin-table-wrap">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Nguồn</th>
                        <th>Nội dung</th>
                        <th>Quyền sử dụng</th>
                        <th>Trạng thái</th>
                        <th>Thu thập</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td>
                                <strong>{item.sourceName}</strong>
                                <span>{item.sourceType}</span>
                            </td>
                            <td>
                                <span>{item.content.slice(0, 120)}</span>
                            </td>
                            <td>{item.consentType}</td>
                            <td>{item.status}</td>
                            <td>{formatDate(item.capturedAt)}</td>
                            <td>
                                <Link href={`/admin/user-signals/${item.id}`} className="text-link">
                                    Chi tiết
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
