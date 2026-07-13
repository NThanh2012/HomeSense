'use client';

import Link from 'next/link';
import { Property } from '../../../features/properties/properties.types';
import { AdminPropertyStatusSelect } from './AdminPropertyStatusSelect';

interface AdminPropertyTableProps {
    items: Property[];
    token: string;
    onUpdated: (property: Property) => void;
}

const formatPrice = (value?: number | null) => {
    if (!value) {
        return 'Chưa có giá';
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

export function AdminPropertyTable({ items, token, onUpdated }: AdminPropertyTableProps) {
    return (
        <div className="admin-table-wrap">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Tin</th>
                        <th>Loại</th>
                        <th>Giá</th>
                        <th>Diện tích</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((property) => (
                        <tr key={property.id}>
                            <td>
                                <Link href={`/admin/properties/${property.id}`} className="admin-table-title">
                                    {property.title}
                                </Link>
                                <span>{property.location?.rawAddress ?? 'Không rõ vị trí'}</span>
                                {property.createdBy ? (
                                    <span>Người đăng: {property.createdBy.fullName ?? property.createdBy.email}</span>
                                ) : null}
                            </td>
                            <td>
                                {property.transactionType} · {property.propertyType}
                            </td>
                            <td>{formatPrice(property.price)}</td>
                            <td>{property.area ? `${property.area} m2` : '—'}</td>
                            <td>
                                <AdminPropertyStatusSelect
                                    property={property}
                                    token={token}
                                    onUpdated={onUpdated}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
