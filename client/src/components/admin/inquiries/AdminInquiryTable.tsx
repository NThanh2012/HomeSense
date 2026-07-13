'use client';

import Link from 'next/link';
import { AdminInquiry } from '../../../features/admin/admin.types';
import { InquiryStatusBadge } from '../../inquiries/InquiryStatusBadge';
import { AdminInquiryStatusSelect } from './AdminInquiryStatusSelect';

interface AdminInquiryTableProps {
    items: AdminInquiry[];
    token: string;
    onUpdated: (inquiry: AdminInquiry) => void;
}

export function AdminInquiryTable({ items, token, onUpdated }: AdminInquiryTableProps) {
    return (
        <div className="admin-table-wrap">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Property</th>
                        <th>Nội dung</th>
                        <th>Trạng thái</th>
                        <th>Cập nhật</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((inquiry) => (
                        <tr key={inquiry.id}>
                            <td>
                                <Link href={`/admin/inquiries/${inquiry.id}`} className="admin-table-title">
                                    {inquiry.user.fullName ?? inquiry.user.email}
                                </Link>
                                <span>{inquiry.user.email}</span>
                            </td>
                            <td>{inquiry.property.title}</td>
                            <td>{inquiry.message.slice(0, 90)}{inquiry.message.length > 90 ? '...' : ''}</td>
                            <td>
                                <InquiryStatusBadge status={inquiry.status} />
                            </td>
                            <td>
                                <AdminInquiryStatusSelect
                                    inquiry={inquiry}
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
