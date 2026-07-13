import Link from 'next/link';
import { AdminUserDemand } from '../../../features/admin-user-demands/admin-user-demands.types';
import { formatArea, formatDate, formatPrice } from '../../../lib/format';

interface AdminUserDemandTableProps {
    items: AdminUserDemand[];
}

export function AdminUserDemandTable({ items }: AdminUserDemandTableProps) {
    return (
        <div className="admin-table-wrap">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Nhu cầu</th>
                        <th>BĐS</th>
                        <th>Ngân sách</th>
                        <th>Diện tích</th>
                        <th>Vị trí</th>
                        <th>Confidence</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td>
                                <strong>{item.demandType}</strong>
                                <span>{item.status}</span>
                            </td>
                            <td>{item.propertyTypes.join(', ') || '—'}</td>
                            <td>{formatPrice(item.minPrice)} - {formatPrice(item.maxPrice)}</td>
                            <td>{formatArea(item.minArea)} - {formatArea(item.maxArea)}</td>
                            <td>{[item.province, item.district, item.rawLocation].filter(Boolean).join(' · ') || '—'}</td>
                            <td>{Math.round(item.sourceConfidence * 100)}%</td>
                            <td>
                                <Link href={`/admin/user-demands/${item.id}`} className="text-link">
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
